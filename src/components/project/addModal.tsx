"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { useAuth } from "@/hooks/useAuth";

type AddProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: any) => void;
};

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function AddProjectModal({
  isOpen,
  onClose,
  onSave,
}: AddProjectModalProps) {
  const { user } = useAuth(); // ✅ Get current logged-in user
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 🧭 Load users only once when modal opens
  useEffect(() => {
    let active = true;
    if (isOpen && active) {
      resetForm();
      fetchUsers();
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTeam([]);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // 🧩 Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || data.data || []);
      } else {
        setErrorMsg(data.message || "Failed to load users.");
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      setErrorMsg("Network error loading users.");
    }
  };

  // 🧩 Select/unselect team members
  const handleTeamSelect = (userId: string) => {
    setTeam((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 🧩 Handle project creation
  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      setSaving(false);
      return;
    }

    if (!user?._id) {
      setErrorMsg("You must be logged in to create a project.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          team,
          createdBy: user._id, // ✅ Current logged-in user
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to create project.");
        return;
      }

      setSuccessMsg("✅ Project successfully created!");
      setTimeout(() => {
        if (typeof onSave === "function" && data?.data) {
          onSave(data.data);
        }
        onClose();
        resetForm();
      }, 1200);
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
          Add New Project
        </h3>

        {errorMsg && (
          <Alert
            variant="error"
            title="Failed to Save Project"
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

        {/* ===== FORM FIELDS ===== */}
        <div className="flex flex-col gap-4 mt-4">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              defaultValue={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project..."
              className="w-full rounded-md border border-gray-300 p-2 text-sm dark:bg-gray-800 dark:text-gray-200"
              rows={3}
            />
          </div>

          {/* Team Selection */}
          <div>
            <Label>Assign Team Members</Label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 dark:border-gray-700">
              {users.length === 0 ? (
                <p className="text-gray-400 text-sm">No users found</p>
              ) : (
                users.map((member) => (
                  <label
                    key={member._id}
                    className="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      value={member._id}
                      checked={team.includes(member._id)}
                      onChange={() => handleTeamSelect(member._id)}
                      className="accent-blue-600"
                    />
                    {member.name}{" "}
                    <span className="text-gray-400">({member.email})</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Add Project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
