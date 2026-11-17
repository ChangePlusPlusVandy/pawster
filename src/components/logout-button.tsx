"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/logout";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);

    try {
      await logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to log out:", error);
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}