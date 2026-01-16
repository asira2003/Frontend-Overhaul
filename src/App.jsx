import React from "react";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import PrimaryLayout from "./components/PrimaryLayout";
import SecondaryLayout, {
  loader as DashboardLayoutLoader,
} from "./components/SecondaryLayout";
import Login, {
  action as LoginAction,
  loader as LoginLoader,
} from "./pages/Login";
import Overview, { loader as OverviewLoader } from "./pages/Overview";
import Users, {
  loader as UsersLoader,
  action as UsersAction,
} from "./pages/Administration/Users";
import UserGroups, {
  loader as UserGroupsLoader,
  action as UserGroupsAction,
} from "./pages/Administration/UserGroups";
import Privileges, {
  loader as PrivilegesLoader,
  action as PrivilegesAction,
} from "./pages/Administration/Privileges";
import Settings, {
  loader as SettingsLoader,
  action as SettingsAction,
} from "./pages/Administration/Settings";
import Customers, {
  loader as CustomersLoader,
  action as CustomersAction,
} from "./pages/Invoicing/Customers";
import TourInvoices, {
  loader as TourInvoicesLoader,
  action as TourInvoicesAction,
} from "./pages/Invoicing/TourInvoices";
import Agents, {
  loader as AgentsLoader,
  action as AgentsAction,
} from "./pages/Administration/Agents";
import AgentInvoices, {
  loader as AgentInvoicesLoader,
  action as AgentInvoicesAction,
} from "./pages/Invoicing/AgentInvoices";
import CustomerInquiries, {
  loader as CustomerInquiriesLoader,
  action as CustomerInquiriesAction,
} from "./pages/Inquiries/CustomerInquiries";
import AgentInquiries, {
  loader as AgentInquiriesLoader,
  action as AgentInquiriesAction,
} from "./pages/Inquiries/AgentInquiries";
import Error from "./pages/Error";
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" errorElement={<Error />}>
      <Route element={<SecondaryLayout />} loader={DashboardLayoutLoader}>
        <Route index element={<Overview />} loader={OverviewLoader} />

        <Route
          path="users"
          element={<Users />}
          loader={UsersLoader}
          action={UsersAction}
        />
        <Route
          path="usergroups"
          element={<UserGroups />}
          loader={UserGroupsLoader}
          action={UserGroupsAction}
        />
        <Route
          path="privileges/:userGroupId"
          element={<Privileges />}
          loader={PrivilegesLoader}
          action={PrivilegesAction}
        />
        <Route
          path="settings"
          element={<Settings />}
          loader={SettingsLoader}
          action={SettingsAction}
        />
        <Route
          path="tourinvoices"
          element={<TourInvoices />}
          loader={TourInvoicesLoader}
          action={TourInvoicesAction}
        />
        <Route
          path="customers"
          element={<Customers />}
          loader={CustomersLoader}
          action={CustomersAction}
        />
        <Route
          path="agents"
          element={<Agents />}
          loader={AgentsLoader}
          action={AgentsAction}
        />
        <Route
          path="agentinvoices"
          element={<AgentInvoices />}
          loader={AgentInvoicesLoader}
          action={AgentInvoicesAction}
        />
        <Route
          path="customerinquiries"
          element={<CustomerInquiries />}
          loader={CustomerInquiriesLoader}
          action={CustomerInquiriesAction}
        />
        <Route
          path="agentinquiries"
          element={<AgentInquiries />}
          loader={AgentInquiriesLoader}
          action={AgentInquiriesAction}
        />
      </Route>
      <Route element={<PrimaryLayout />}>
        <Route
          path="login"
          element={<Login />}
          loader={LoginLoader}
          action={LoginAction}
        />
      </Route>
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
