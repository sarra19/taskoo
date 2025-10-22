"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { GroupIcon } from "../../../public/images/icons";
import { useAuth } from "@/hooks/useAuth";
import TaskModal from "../task/addModal";

interface Member {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  team: Member[];
  projectId: string; // ✅ new prop
}

export default function TeamModal({
  isOpen,
  onClose,
  projectName,
  team,
  projectId,
}: TeamModalProps) {
  const { user } = useAuth();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

const handleOpenTaskModal = (memberId: string) => {
  // Close the Team modal first
  onClose();

  // Wait a bit to let the modal close animation finish
  setTimeout(() => {
    setSelectedMemberId(memberId);
    setIsTaskModalOpen(true);
  }, 300); // ⏱️ 300ms delay to feel smooth
};

  const handleAddTask = (newTask: any) => {
    console.log("✅ Task added for member:", selectedMemberId, "in project:", projectId, newTask);
    setIsTaskModalOpen(false);
    setSelectedMemberId(null);
  };

  return (
    <>
      {/* --- Team Modal --- */}
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] m-4">
        <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
              <GroupIcon />
              <span>Team Members — {projectName}</span>
            </h3>
          </div>

          {team.length === 0 ? (
            <p className="text-gray-500 text-sm">No team members assigned.</p>
          ) : (
            <ul className="flex flex-col gap-3 max-h-64 overflow-y-auto">
              {team.map((member) => (
                <li
                  key={member._id}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-2"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={member.avatar || "/images/user/user.jpg"}
                      alt={member.name || "member"}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {member.name || "Unnamed User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.email || member._id}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      onClick={() => handleOpenTaskModal(member._id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md"
                    >
                      + Task
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- Add Task Modal --- */}
      {isAdmin && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedMemberId(null);
          }}
          onSave={handleAddTask}
          assignedTo={selectedMemberId}
          projectId={projectId} // ✅ send projectId to backend
        />
      )}
    </>
  );
}
