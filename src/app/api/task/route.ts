import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import { z, ZodError } from "zod";

// ✅ Validation schema
const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string(),
  projectId: z.string().min(1, "Project is required"),
});

// ✅ Helper — get current user ID from JWT token
async function getUserIdFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const token = cookieHeader
    ?.split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assignedTo = searchParams.get("assignedTo");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

  const filter: any = {};

  if (projectId) filter.projectId = projectId;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  try {
    const tasks = await Task.find(filter)
      .populate("assignedTo", "_id name email avatar")
      .populate("projectId", "_id title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// ✅ POST — Create a new task
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    await connectDB();

    // 🔍 Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser)
      return NextResponse.json({ message: "User not found" }, { status: 404 });

    // ✅ Assign logic
    let assignedUserId = userId;
    if (currentUser.role === "admin" && body.assignedTo) {
      const assignedUser = await User.findById(body.assignedTo);
      if (!assignedUser) {
        return NextResponse.json(
          { message: "Assigned user not found" },
          { status: 400 }
        );
      }
      assignedUserId = assignedUser._id;
    }

    const task = await Task.create({
      ...parsed,
      createdBy: userId,
      assignedTo: assignedUserId,
      project: parsed.projectId,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/task error:", err);
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: err.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: err.errors || err.message },
      { status: 400 }
    );
  }
}
