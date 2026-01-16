"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (token) {
      router.replace("/users");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center text-neutral-400">
      Redirecting…
    </div>
  );
}
