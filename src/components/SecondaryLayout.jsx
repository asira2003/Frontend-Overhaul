import React from "react";
import {
  Outlet,
  redirect,
  useLoaderData,
  useNavigation,
} from "react-router-dom";
import Header from "./SecondaryHeader";
import Footer from "./SecondaryFooter";
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
    loaderData.pathname === "/customers" ||
    loaderData.pathname === "/agents" ||
    /\/privileges/.test(loaderData.pathname)
      ? "administration"
      : loaderData.pathname === "/settings"
      ? "settings"
      : loaderData.pathname === "/tourinvoices" ||
        loaderData.pathname === "/agentinvoices"
      ? "invoicing"
      : loaderData.pathname === "/customerinquiries" ||
        loaderData.pathname === "/agentinquiries"
      ? "inquiries"
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
      : loaderData.pathname === "/tourinvoices"
      ? "tourinvoices"
      : loaderData.pathname === "/agentinvoices"
      ? "agentinvoices"
      : loaderData.pathname === "/customers"
      ? "customers"
      : loaderData.pathname === "/agents"
      ? "agents"
      : loaderData.pathname === "/customerinquiries"
      ? "customerinquiries"
      : loaderData.pathname === "/agentinquiries"
      ? "agentinquiries"
      : loaderData.pathname === "/"
      ? "overview"
      : "";
  return (
    <>
      {renderThrobber(navigation)}
      <Header entryUser={loaderData.entryUser} />
      <SideNavbar
        activeModuleParam={activeModule}
        activeFeatureParam={activeFeature}
      />
      <Outlet />
      <Footer />
    </>
  );
}

function renderThrobber(navigation) {
  if (navigation.state === "loading") {
    return <Throbber throbberAlignment="content-center" />;
  }
}
