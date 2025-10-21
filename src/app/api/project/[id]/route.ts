import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

/**
 * 🧭 GET /api/projects/[id]
 * Get a single project by ID with team & creator populated
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const project = await Project.findById(params.id)
      .populate({
        path: "team",
        select: "_id name email avatar", // ✅ show team details
      })
      .populate({
        path: "createdBy",
        select: "_id name email avatar",
      })
      .lean();

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching project:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * ✏️ PUT /api/projects/[id]
 * Updates project details (title, description, team, etc.)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();

    const updated = await Project.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    )
      .populate({
        path: "team",
        select: "_id name email avatar",
      })
      .populate({
        path: "createdBy",
        select: "_id name email avatar",
      })
      .lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /projects/:id error", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * 🗑️ DELETE /api/projects/[id]
 * Soft delete — set deletedAt timestamp
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    if (project.deletedAt) {
      return NextResponse.json(
        { success: false, message: "Project already deleted" },
        { status: 400 }
      );
    }

    project.deletedAt = new Date();
    await project.save();

    return NextResponse.json({
      success: true,
      message: "Project soft-deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /projects/:id error", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
