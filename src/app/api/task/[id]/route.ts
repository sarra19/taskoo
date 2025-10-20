import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

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

// ✅ GET one task
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const task = await Task.findOne({ _id: params.id, createdBy: userId });
    if (!task)
      return NextResponse.json({ message: "Task not found" }, { status: 404 });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("GET /api/task/[id] error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PUT update task
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const task = await Task.findOne({ _id: params.id, createdBy: userId });
    if (!task)
      return NextResponse.json({ message: "Task not found" }, { status: 404 });

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    Object.assign(task, parsed);
    await task.save();

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("PUT /api/task/[id] error:", error);
    if (error instanceof ZodError) {
          return NextResponse.json(
      {
              message: "Validation error",
              errors: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },        { status: 400 }
          );
        }
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

// ✅ DELETE (soft delete)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const task = await Task.findOne({ _id: params.id, createdBy: userId });
    if (!task)
      return NextResponse.json({ message: "Task not found" }, { status: 404 });

    task.deletedAt = new Date();
    await task.save();

    return NextResponse.json({ message: "Task deleted" });
  } catch (error: any) {
    console.error("DELETE /api/task/[id] error:", error);
    
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
