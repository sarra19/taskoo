import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User"; // ✅ to check role

// Helper: extract userId from JWT cookie
async function getUserIdFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const token = cookieHeader
    ?.split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Fetch user role
    const user = await User.findById(userId).select("role");
    if (!user)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Parse filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    // Base query
    const query: any = {
      project: params.projectId,
      deletedAt: null,
    };

    // Apply filters
    if (status && status !== "all") query.status = status;
    if (priority) query.priority = priority;
    if (search)
      query.title = { $regex: search, $options: "i" };

    // If member, only see their assigned tasks
    if (user.role !== "admin") {
      query.assignedTo = userId;
    }

    // Fetch tasks
    const tasks = await Task.find(query)
      .populate("assignedTo", "_id name email avatar")
      .populate("createdBy", "_id name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("GET /api/task/project/[projectId] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
