"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/hooks/useAuth";

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  initialData?: any;
};

export default function TaskModalEdit({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TaskModalProps) {
  const { user } = useAuth();
  const isMember = user?.role === "member"; // ✅ Role check

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setTags(initialData.tags || []);
      setStatus(initialData.status || "todo");
      setPriority(initialData.priority || "medium");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : null);
    } else if (isOpen) {
      setTitle("");
      setDescription("");
      setTags([]);
      setStatus("todo");
      setPriority("medium");
      setDueDate(null);
    }
    setSuccessMsg("");
    setErrorMsg("");
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData ? `/api/task/${initialData._id}` : "/api/task";

      // ✅ Members can only update status
      const body: any = isMember
        ? { status }
        : {
            title,
            description,
            tags,
            status,
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save task");

      setSuccessMsg("Task updated successfully!");
      setTimeout(() => {
        onSave(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Edit Task
        </h3>

        {errorMsg && (
          <Alert variant="error" title="Error" message={errorMsg} showLink={false} />
        )}
        {successMsg && (
          <Alert variant="success" title="Success" message={successMsg} showLink={false} />
        )}

        <div className="flex flex-col gap-4 mt-4">
          {/* ✅ Only visible for admin (not members) */}
          {!isMember && (
            <>
              <div>
                <Label>Title</Label>
                <Input
                  defaultValue={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                />
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
                  defaultDate={dueDate ? [dueDate] : []}
                  onChange={(dates: Date[]) => {
                    const selectedDate = dates?.length ? dates[0] : null;
                    setDueDate(selectedDate);
                  }}
                />
              </div>
            </>
          )}

          {/* ✅ Status — visible for everyone */}
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
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
