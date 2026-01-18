import React from "react";
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
import { requireAuth } from "../api/administration/authenticationApi";

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
