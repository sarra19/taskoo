import { NextResponse } from "next/server";
import Task from "@/models/Task";
import { connectDB as dbConnect } from "@/lib/db";
export async function GET() {
  try {
    await dbConnect();

    const tasks = await Task.find()
      .populate({
        path: "assignedTo",
        select: "_id name email",
      })
      .populate({
        path: "project",
        select: "_id title", // ✅ get project title
      })
      .lean();

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching tasks" },
      { status: 500 }
    );
  }
}
