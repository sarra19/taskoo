"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
};

export default function TaskModal({ isOpen, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Reset form each time modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setTags([]);
      setStatus("todo");
      setPriority("medium");
      setDueDate(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setSaving(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags,
          status,
          priority,
          dueDate: dueDate ? dueDate.toISOString() : null,
        }),
      });

      const data = await res.json();

      // 🧾 Handle validation errors from backend (Zod)
      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: { path: string; message: string }) => {
            errors[err.path] = err.message;
          });
          setFieldErrors(errors);
          return;
        }
        return alert(data.message || "An error occurred");
      }

      onSave(data);
      onClose();
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Add New Task</h3>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              className="w-full rounded-md border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:text-gray-200"
              rows={3}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.description}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. frontend, bug, urgent"
            />
            {fieldErrors.tags && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.tags}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            {fieldErrors.status && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.status}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {fieldErrors.priority && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.priority}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <Label>Due Date</Label>
            <DatePicker
              id="date-picker"
              placeholder="Choose a date"
              onChange={(dates: Date[], _currentDateString: string) => {
                const selectedDate = dates?.length ? dates[0] : null;
                setDueDate(selectedDate);
              }}
            />
            {fieldErrors.dueDate && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.dueDate}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Add Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
