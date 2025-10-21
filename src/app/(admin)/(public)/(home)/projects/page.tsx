"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Image from "next/image";
import { Plus, Edit, Trash2 } from "lucide-react";
import EditProjectModal from "@/components/project/editModal";
import AddProjectModal from "@/components/project/addModal";
import { GroupIcon } from "../../../../../../public/images/icons";
import { useAuth } from "@/hooks/useAuth";
import TeamModal from "@/components/project/teamModal";

interface Member {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Project {
  _id: string;
  title: string;
  description?: string;
  progress: number;
  team: Member[];
  status: "completed" | "in-progress";
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Member[]>([]);
  const [selectedProjectName, setSelectedProjectName] = useState("");

  // 🔹 Fetch projects from API
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/project");
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 🔹 Add new project (callback)
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // 🔹 Edit project
  const handleEditProject = async (updatedProject: Project) => {
    try {
      const res = await fetch(`/api/project/${updatedProject._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        setEditModalOpen(false);
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (error) {
      console.error("Failed to edit project:", error);
    }
  };

  // 🔹 Delete project
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      if (res.ok) fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <div>

      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Projects Overview
          </h3>

          {/* ✅ Only show Add Project if user is admin */}
          {user?.role === "admin" && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Add Project
            </button>
          )}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project._id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.04]"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {project.title}
                </h4>
                <div className="flex gap-2">
                  {/* ✏️ Edit and Delete only for Admin */}
                  {user?.role === "admin" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setEditModalOpen(true);
                        }}
                        className="text-gray-500 hover:text-indigo-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {project.description || "No description provided"}
              </p>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full ${project.status === "completed"
                    ? "bg-green-500"
                    : "bg-blue-500"
                    } transition-all duration-500`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>

              {/* Team members preview */}
              <div className="mt-4 flex -space-x-2">
                {project.team.slice(0, 4).map((member) => {
                  console.log("👤 Member avatar:", member.avatar);

                  return (
                    <Image
                      key={member._id}
                      src={member.avatar || "/images/photo.png"}
                      alt={member.name || "member"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                    />
                  );
                })}

                {project.team.length > 4 && (
                  <span className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                    +{project.team.length - 4}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4">
                {/* 👥 View Members */}
                <button
                  onClick={() => {
                    setSelectedTeam(project.team);
                    setSelectedProject(project);
                    setSelectedProjectName(project.title);
                    setTeamModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition"
                >
                  <GroupIcon />
                  <span>View Members</span>
                </button>



                <button
                  onClick={() => {
                    window.location.href = `/task?projectId=${project._id}`;
                  }}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition"
                >
                  <Plus size={14} />
                  <span>
                    {user?.role === "admin" ? "View All Tasks" : "View My Tasks"}
                  </span>
                </button>


              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ➕ Add Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddProject}
      />

      {/* ✏️ Edit Project Modal */}
      {selectedProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProject(null);
          }}
          onSave={handleEditProject}
          initialData={selectedProject}
        />
      )}

      {/* 👥 Team Members Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        projectName={selectedProjectName}
        team={selectedTeam}
        projectId={selectedProject?._id || ""}
      />

    </div>
  );
}
