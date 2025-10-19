"use client";

import React, { useState } from "react";
import { Calendar, MessageCircle, Plus, Filter, Edit, Trash2 } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

type Task = {
  id: number;
  title: string;
  date: string;
  status: string;
  comments: number;
  tags?: string[];
};

// Couleurs attribuées à certains tags (modifiable)
const tagColors: Record<string, string> = {
  Design: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  UX: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Team: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Dashboard: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Flow: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Management: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Feedback: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "React Native": "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  Flutter: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Finish user onboarding", date: "Tomorrow", status: "To Do", comments: 1, tags: ["Design", "UX"] },
    { id: 2, title: "Solve the Dribbble prioritisation issue", date: "Jan 8, 2027", status: "To Do", comments: 2, tags: ["Team"] },
    { id: 3, title: "Work In Progress (WIP) Dashboard", date: "Today", status: "In Progress", comments: 1, tags: ["Dashboard"] },
    { id: 4, title: "Kanban Flow Manager", date: "Feb 12, 2027", status: "In Progress", comments: 8, tags: ["Flow", "Management"] },
    { id: 5, title: "Manage internal feedback", date: "Tomorrow", status: "Completed", comments: 1, tags: ["Feedback"] },
    { id: 6, title: "Do some projects on React Native with Flutter", date: "Jan 8, 2027", status: "Completed", comments: 2, tags: ["React Native", "Flutter"] },
  ]);

  const statuses = ["To Do", "In Progress", "Completed"];
  const filters = ["All Tasks", ...statuses];
  const [activeFilter, setActiveFilter] = useState("All Tasks");

  const handleDelete = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    const taskId = Number(e.dataTransfer.getData("taskId"));
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const filteredTasks =
    activeFilter === "All Tasks" ? tasks : tasks.filter((t) => t.status === activeFilter);

  return (
    <div>
      <PageBreadcrumb pageTitle="Task Board" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {/* Filter & Add */}
        <div className="mb-6 flex flex-wrap items-center justify-between">
          <div className="flex gap-2 mb-2 md:mb-0">
            {filters.map((f) => (
              <button
                key={f}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  activeFilter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
                onClick={() => setActiveFilter(f)}
              >
                {f} ({f === "All Tasks" ? tasks.length : tasks.filter((t) => t.status === f).length})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <Filter size={16} /> Filter & Sort
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
              <Plus size={16} /> Add New Task
            </button>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {statuses.map((status) => {
            if (activeFilter !== "All Tasks" && activeFilter !== status) return null;

            return (
              <div
                key={status}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40"
                onDrop={(e) => handleDrop(e, status)}
                onDragOver={handleDragOver}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                    {status} ({filteredTasks.filter((t) => t.status === status).length})
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredTasks
                    .filter((t) => t.status === status)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900 cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        {/* Edit/Delete buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => alert(`Edit task #${task.id}`)}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">{task.title}</h4>

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <Calendar size={14} />
                          <span>{task.date}</span>
                          <MessageCircle size={14} className="ml-2" />
                          <span>{task.comments}</span>
                        </div>

                        {/* Tags avec couleur */}
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.map((tag, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                tagColors[tag] || "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
