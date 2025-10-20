"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

       
        router.push("/signin");
      } catch (error) {
        console.error("Logout failed:", error);
        router.push("/signin");
      }
    };

    handleLogout();
  }, [router]);

  return (
   <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
      <p>Signing out...</p>
    </div>
    </div>
  );
}
