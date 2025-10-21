"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";

import TaskModalEdit from "@/components/task/editModal";

interface CalendarEvent extends EventInput {
  extendedProps: {
    taskId?: string;
    title?: string;
    description?: string;
    tags?: string[];
    status?: string;
    priority?: string;
    dueDate?: string;
  };
}

const TaskCalendar: React.FC = () => {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // ✅ Fetch tasks for this project
  const fetchTasks = async () => {
    if (!projectId) return;

    try {
      const res = await fetch(`/api/task/project/${projectId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to fetch tasks");

      const mappedEvents = result.data.map((task: any) => ({
        id: task._id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        extendedProps: {
          taskId: task._id,
          title: task.title,
          description: task.description,
          tags: task.tags || [],
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      }));

      setTasks(mappedEvents);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // ✅ Click to edit
  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps;

    const clickedTask = {
      _id: props.taskId,
      title: props.title || "",
      description: props.description || "",
      tags: props.tags || [],
      status: props.status || "todo",
      priority: props.priority || "medium",
      dueDate: props.dueDate || clickInfo.event.startStr,
      project: projectId,
    };

    setSelectedTask(clickedTask);
    setEditModalOpen(true);
  };

  // ✅ Refresh after editing
  const handleSaveTask = async () => {
    await fetchTasks();
  };

  // ✅ Render colored cards
  const renderEventContent = (eventInfo: EventContentArg) => {
    const priority = eventInfo.event.extendedProps.priority;

    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      urgent: { bg: "bg-red-50", border: "bg-red-500", text: "text-red-800" },
      high: { bg: "bg-orange-50", border: "bg-orange-500", text: "text-orange-800" },
      medium: { bg: "bg-blue-50", border: "bg-blue-500", text: "text-blue-800" },
      low: { bg: "bg-green-50", border: "bg-green-500", text: "text-green-800" },
    };

    const style = colorMap[priority] || colorMap["medium"];

    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${style.bg}`}>
        <div className={`w-1.5 h-4 rounded-full ${style.border}`} />
        <span className={`truncate text-sm font-medium ${style.text}`}>
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          selectable={false} // ❌ disable selecting new dates
          eventClick={handleEventClick}
          events={tasks}
          eventContent={renderEventContent}
        />
      </div>

      {selectedTask && (
        <TaskModalEdit
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
          initialData={selectedTask}
        />
      )}
    </div>
  );
};

export default TaskCalendar;
