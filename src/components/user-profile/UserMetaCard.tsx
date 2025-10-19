"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth"; // 🔥 assure-toi que le chemin est correct
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, loading } = useAuth(); // 👈 récupération du user connecté

  const handleSave = () => {
    console.log("Saving changes...");
    closeModal();
  };

  // 🔄 Pendant le chargement
  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src="/images/user/owner.jpg"
                alt="user"
              />
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user ? user.name : "Utilisateur"} {/* 👈 le nom du user connecté */}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
