"use client";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

import { Button } from "./ui/button";

export function Logout() {
  const [isLoading, setLoading] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    router.push("/login");
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label={isLoading ? "ログアウト中…" : "ログアウト"}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          ログアウト
          <LogOut className="ml-2 size-4" aria-hidden="true" />
        </>
      )}
    </Button>
  );
}
