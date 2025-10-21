"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Plus, Edit, Trash2, Search } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import TaskModal from "@/components/task/addModal";
import TaskModalEdit from "@/components/task/editModal";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { CalenderIcon } from "../../../../../public/images/icons";

type Task = {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  status: string;
  dueDate?: string;
  priority?: string;
  project?: string;
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { user } = useAuth();
  const router = useRouter();

  const statuses = [
    { key: "todo", label: "To Do" },
    { key: "in-progress", label: "In Progress" },
    { key: "done", label: "Completed" },
  ];

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (activeStatus !== "all") params.append("status", activeStatus);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await fetch(
        `/api/task/project/${projectId}?${params.toString()}`
      );
      const data = await res.json();

      if (data.success) {
        setTasks(data.data);
      } else {
        console.error("❌ Failed to fetch tasks:", data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(timeout);
  }, [activeStatus, priorityFilter, searchTerm, projectId]);

  const handleSave = () => fetchTasks();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await fetch(`/api/task/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    newStatus: string
  ) => {
    const id = e.dataTransfer.getData("taskId");
    await fetch(`/api/task/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();

  const priorityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    urgent: "bg-red-100 text-red-700 border-red-200",
  };

  if (loading)
    return <p className="p-5 text-gray-500 text-center">Loading tasks...</p>;

  return (
    <div>
      <PageBreadcrumb pageTitle="Task Board" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveStatus("all")}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                activeStatus === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              All Tasks
            </button>
            {statuses.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveStatus(key)}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeStatus === key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* ✅ Calendar Button */}
            <button
  onClick={() => router.push(`/calendar?projectId=${projectId}`)}
  disabled={!projectId} // disable if no project selected
  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition
    ${
      projectId
        ? "bg-indigo-600 text-white hover:bg-indigo-700"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
>
  <CalenderIcon className="w-4 h-4" />
  <span>Calendar View</span>
</button>

          </div>
        </div>

        {/* Task Columns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {statuses.map(({ key, label }) => (
            <div
              key={key}
              onDrop={(e) => handleDrop(e, key)}
              onDragOver={handleDragOver}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                  {label} ({tasks.filter((t) => t.status === key).length})
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {tasks
                  .filter((t) => t.status === key)
                  .map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 cursor-move"
                    >
                      {/* Edit/Delete */}
                      <div className="absolute top-2 right-2 flex gap-2 text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setEditModalOpen(true);
                          }}
                          className="hover:text-indigo-600"
                        >
                          <Edit size={15} />
                        </button>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Due Date + Priority */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <Calendar size={14} />
                          <span>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>

                        {task.priority && (
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full border ${priorityColors[task.priority]}`}
                          >
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Task Modal */}
      {selectedTask && (
        <TaskModalEdit
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleSave}
          initialData={selectedTask}
        />
      )}
    </div>
  );
}
