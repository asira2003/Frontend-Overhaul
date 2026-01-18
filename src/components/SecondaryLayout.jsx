import React, { useEffect, useState } from "react";
import {
  Outlet,
  redirect,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import Header from "./SecondaryHeader";
import PrimaryFooter from "./PrimaryFooter.jsx";
import SideNavbar from "./SideNavbar";
import Throbber from "./throbbers/FullscreenThrobber.jsx";
import ServerMessageToast from "./ServerMessageToast";
import { requireAuth } from "../api/administration/authenticationApi";
import { consumeToasts } from "../utils/ToastBus";

export async function loader({ request }) {
  const url = new URL(request.url);
  const { message } = await requireAuth();
  if (!message.success) {
    throw redirect("login");
  }
  return {
    pathname: url.pathname,
    entryUser: {
      userFullName: sessionStorage.getItem("fullName"),
      userGroupDescription: sessionStorage.getItem("userGroupDescription"),
    },
  };
}

export default function SecondaryLayout() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();
  const [toasts, setToasts] = useState([]);
  const [toastCounter, setToastCounter] = useState(0);
  useGlobalToastConsumer(navigation, setToasts, setToastCounter);
  const activeModule =
    loaderData.pathname === "/users" ||
    loaderData.pathname === "/usergroups" ||
    /\/privileges/.test(loaderData.pathname)
      ? "administration"
      : loaderData.pathname === "/settings"
        ? "settings"
        : loaderData.pathname === "/"
          ? "overview"
          : "";
  const activeFeature =
    loaderData.pathname === "/users"
      ? "users"
      : loaderData.pathname === "/usergroups" ||
          /\/privileges/.test(loaderData.pathname)
        ? "usergroups"
        : loaderData.pathname === "/settings"
          ? "settings"
          : loaderData.pathname === "/"
            ? "overview"
            : "";
  return (
    <>
      {renderThrobber(navigation)}
      <Header entryUser={loaderData.entryUser} />
      {/* <SideNavbar
        activeModuleParam={activeModule}
        activeFeatureParam={activeFeature}
      /> */}
      {/* Global toast wrapper for dashboard pages */}
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
      <PrimaryFooter />
    </>
  );
}

function renderThrobber(navigation) {
  if (navigation.state === "loading") {
    return <Throbber throbberAlignment="content-center" />;
  }
}

// Consume any queued global toasts on navigation settle
export function useGlobalToastConsumer(navigation, setToasts, setToastCounter) {
  useEffect(() => {
    if (navigation.state === "idle") {
      const queued = consumeToasts();
      if (queued.length > 0) {
        setToasts((prev) => {
          const list = prev.map((x) => x);
          queued.forEach((msg) => {
            list.unshift({ id: setToastCounterRef.next(), message: msg });
          });
          return list.slice(0, 3);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state]);

  // Also consume when a toast is pushed (same-tab event)
  useEffect(() => {
    function handler() {
      const queued = consumeToasts();
      if (queued.length > 0) {
        setToasts((prev) => {
          const list = prev.map((x) => x);
          queued.forEach((msg) => {
            list.unshift({ id: setToastCounterRef.next(), message: msg });
          });
          return list.slice(0, 3);
        });
      }
    }
    window.addEventListener("global-toast-pushed", handler);
    // Consume any pre-existing toasts on mount
    handler();
    return () => window.removeEventListener("global-toast-pushed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// simple counter helper
const setToastCounterRef = {
  _c: 0,
  next() {
    this._c += 1;
    return this._c;
  },
};
