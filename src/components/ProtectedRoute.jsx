"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { requireAuth } from "../api/administration/authenticationApi";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const res = await requireAuth();
        if (res && (res.loggedIn === true || res?.status === "OK")) {
          setReady(true);
        } else {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      }
    }
    check();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-neutral-400">
        Checking authentication…
      </div>
    );
  }

  return children;
}
