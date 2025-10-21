"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Image from "next/image";

export default function Profile() {
  const { user, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    newPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        newPassword: "",
      });
      setAvatarPreview(user.avatar || "/default-avatar.png"); // Image par défaut
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Gestion upload avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("newPassword", formData.newPassword);
      if (avatarFile) formDataToSend.append("avatar", avatarFile);

      const res = await fetch("/api/user", {
        method: "PUT",
        body: formDataToSend, // ⚡ on envoie FormData pour gérer upload
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errors: Record<string, string> = {};
          data.errors.forEach(
            (err: { path: string; message: string }) =>
              (errors[err.path] = err.message)
          );
          setFieldErrors(errors);
          return;
        }

        setErrorMsg(data.message || "Update failed");
        return;
      }

      setSuccessMsg("Profile updated successfully!");
      setFormData({ ...formData, newPassword: "" });
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMsg("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    );

  if (!user)
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          No user logged in.
        </p>
      </div>
    );

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Edit Personal Information
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Update your details to keep your profile up to date.
        </p>

        {/* ✅ Alerts */}
        {errorMsg && (
          <Alert variant="error" title="Error" message={errorMsg} showLink={false} />
        )}
        {successMsg && (
          <Alert variant="success" title="Success" message={successMsg} showLink={false} />
        )}

        {/* ✅ Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-28 h-28">
            <Image
              src={avatarPreview || "/default-avatar.png"}
              alt="User avatar"
              fill
              className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          </div>
          <label className="mt-3 text-sm font-medium text-gray-500 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            Change avatar
          </label>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2 mt-4">
          <div>
            <Label>
              Name<span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              name="name"
              defaultValue={formData.name}
              onChange={handleChange}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label>
              Email<span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              name="email"
              defaultValue={formData.email}
              onChange={handleChange}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-error-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="col-span-2 lg:col-span-1">
            <Label>New Password</Label>
            <Input
              type="password"
              name="newPassword"
              defaultValue={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
            />
            {fieldErrors.newPassword && (
              <p className="mt-1 text-sm text-error-500">
                {fieldErrors.newPassword}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8 justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
