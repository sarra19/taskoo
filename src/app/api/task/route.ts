import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string(),
});

//  Middleware helper: get user from token
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

//  GET → list tasks (with optional filters)
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    const filter: any = { createdBy: userId, deletedAt: null };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: "i" };
    if (tag) filter.tags = { $in: [tag] };

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("GET /api/task error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST → create new task
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    await connectDB();
    const task = await Task.create({ ...parsed, createdBy: userId });
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
