"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Alert from "@/components/ui/alert/Alert";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  assignedTo?: string | null;
  projectId: string;
};

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  assignedTo,
  projectId,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Reset form every time modal opens or closes
  useEffect(() => {
    if (!isOpen || isOpen) {
      setTitle("");
      setDescription("");
      setTags([]);
      setStatus("todo");
      setPriority("medium");
      setDueDate(null);
      setFieldErrors({});
      setSuccessMsg("");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!assignedTo) {
      setErrorMsg("No team member selected for this task.");
      return;
    }

    setSaving(true);
    setFieldErrors({});
    setSuccessMsg("");
    setErrorMsg("");

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
          assignedTo,
          projectId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach((err: { path: string; message: string }) => {
            errors[err.path] = err.message;
          });
          setFieldErrors(errors);
          return;
        }

        setErrorMsg(data.message || "An error occurred while saving the task.");
        return;
      }

      setSuccessMsg("Task successfully added!");
      setTimeout(() => {
        onSave(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Add New Task
        </h3>

        {errorMsg && (
          <Alert
            variant="error"
            title="Failed to Save Task"
            message={errorMsg}
            showLink={false}
          />
        )}

        {successMsg && (
          <Alert
            variant="success"
            title="Success"
            message={successMsg}
            showLink={false}
          />
        )}

        <div className="flex flex-col gap-4 mt-4">
          <div>
            <Label>Title</Label>
            <Input
              defaultValue={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-500">{fieldErrors.title}</p>
            )}
          </div>

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
              <p className="text-xs text-red-500">{fieldErrors.description}</p>
            )}
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              defaultValue={tags.join(", ")}
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
          </div>

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
          </div>

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
          </div>

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
          </div>
        </div>

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
