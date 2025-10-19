"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // 🔹 Call your logout API route
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        // ✅ Whether it succeeds or not, send to signin
        router.push("/signin");
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/signin");
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-700 dark:text-gray-200">
      <p>Signing out...</p>
    </div>
  );
}
