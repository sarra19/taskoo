import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";

export async function GET() {
  try {
    await connectDB();

    const projects = await Project.find({ deletedAt: null })
      .populate({
        path: "team",
        select: "_id name email avatar",
      })
      .populate({
        path: "createdBy",
        select: "_id name email avatar",
      })
      .lean();

    // ✅ Calculate progress dynamically for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({
          project: project._id,
          deletedAt: null,
        });

        const completedTasks = await Task.countDocuments({
          project: project._id,
          status: "done",
          deletedAt: null,
        });

        const progress =
          totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        const status = progress === 100 ? "completed" : "in-progress";

        return {
          ...project,
          progress,
          status,
        };
      })
    );

    return NextResponse.json(
      { success: true, data: projectsWithProgress },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching projects" },
      { status: 500 }
    );
  }
}

// ---------------------- POST ----------------------
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { title, description, team, createdBy } = body;

    // ✅ Validation basique
    if (!title || !createdBy) {
      return NextResponse.json(
        { success: false, message: "Title and createdBy are required" },
        { status: 400 }
      );
    }

   

    // ✅ Calcul initial de la progression selon les tâches assignées à la team
    const teamIds = team || [];
    const totalTasks = await Task.countDocuments({
      assignedTo: { $in: teamIds },
      deletedAt: null,
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: { $in: teamIds },
      status: "done",
      deletedAt: null,
    });
    const progress =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const status = progress === 100 ? "completed" : "in-progress";

    // ✅ Création du projet
    const project = await Project.create({
      title,
      description,
      team,
      progress,
      status,
      createdBy,
    });

    // ✅ Retour clair
    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("❌ Error creating project:", error);
    return NextResponse.json(
      { success: false, message: "Error creating project" },
      { status: 500 }
    );
  }
}
