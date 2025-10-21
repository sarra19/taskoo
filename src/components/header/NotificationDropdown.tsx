"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "@/hooks/useAuth";

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDate: string;
  assignedTo?: string | { _id: string };
  project?: string | { _id: string; title: string };
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<Task[]>([]);
  const { user } = useAuth();

  // 🔔 Fetch tasks due tomorrow for current user (or all if admin)
  useEffect(() => {
    if (!user?._id) return;

    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/task/all");
        const result = await res.json();
        const data: Task[] = result?.data || [];

        if (!Array.isArray(data)) return;

        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const isSameDay = (date1: Date, date2: Date) =>
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate();

        // ✅ Filter by date (and user unless admin)
        const tasksDueTomorrow = data.filter((task) => {
          const assignedId =
            typeof task.assignedTo === "object"
              ? (task.assignedTo as any)?._id
              : task.assignedTo;

          const isTomorrow =
            task.dueDate &&
            isSameDay(new Date(task.dueDate), tomorrow);

          if (user.role === "admin") return isTomorrow;
          return assignedId === user._id && isTomorrow;
        });

        setNotifications(tasksDueTomorrow);
        setNotifying(tasksDueTomorrow.length > 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 60 * 60 * 1000); // Refresh hourly
    return () => clearInterval(interval);
  }, [user?._id, user?.role]);

  const toggleDropdown = () => setIsOpen((p) => !p);
  const closeDropdown = () => setIsOpen(false);
  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  return (
    <div className="relative">
      {/* 🔔 Icon */}
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {notifying && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* 🔽 Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* 📅 Notifications */}
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">
              No reminders for tomorrow 🎉
            </p>
          ) : (
            notifications.map((task) => (
              <li key={task._id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {task.title}
                    </span>

                    {/* ✅ Project title */}
                    {task.project && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                        📁{" "}
                        {typeof task.project === "object"
                          ? (task.project as any).title
                          : ""}
                      </span>
                    )}

                    {task.description && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {task.description}
                      </span>
                    )}

                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Due tomorrow (
                      {new Date(task.dueDate).toLocaleDateString()})
                    </span>

                    <span
                      className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        task.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "high"
                          ? "bg-orange-100 text-orange-700"
                          : task.priority === "medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
