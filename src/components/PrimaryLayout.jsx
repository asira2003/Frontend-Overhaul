import React, { useEffect, useState } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import Header from "./PrimaryHeader";
import Footer from "./PrimaryFooter";
import Throbber from "./throbbers/FullscreenThrobber.jsx";
import ServerMessageToast from "./ServerMessageToast";
import { consumeToasts } from "../utils/ToastBus";

export default function PrimaryLayout() {
  const navigation = useNavigation();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (navigation.state === "idle") {
      const queued = consumeToasts();
      if (queued.length > 0) {
        setToasts((prev) => {
          const list = prev.map((x) => x);
          queued.forEach((msg) => {
            const id = Date.now() + Math.random();
            list.unshift({ id, message: msg });
          });
          return list.slice(0, 3);
        });
      }
    }
  }, [navigation.state]);
  useEffect(() => {
    function handler() {
      const queued = consumeToasts();
      if (queued.length > 0) {
        setToasts((prev) => {
          const list = prev.map((x) => x);
          queued.forEach((msg) => {
            const id = Date.now() + Math.random();
            list.unshift({ id, message: msg });
          });
          return list.slice(0, 3);
        });
      }
    }
    window.addEventListener("global-toast-pushed", handler);
    // Consume any pre-existing toasts on mount
    handler();
    return () => window.removeEventListener("global-toast-pushed", handler);
  }, []);
  return (
    <>
      {renderThrobber(navigation)}
      <Header />
      {/* Global toast wrapper for primary pages (e.g., login) */}
      <div className="toast-wrapper">
        {toasts.map((toast, index) => (
          <ServerMessageToast
            key={toast.id}
            message={toast.message}
            id={toast.id}
            index={index}
            onRemove={(id) => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
            }}
          />
        ))}
      </div>
      <Outlet />
      <Footer />
    </>
  );
}

function renderThrobber(navigation) {
  if (navigation.state === "loading") {
    return <Throbber throbberAlignment="center" />;
  }
}
