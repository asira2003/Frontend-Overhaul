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
import Error from "./pages/Error";
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" errorElement={<Error />}>
      <Route element={<SecondaryLayout />} loader={DashboardLayoutLoader}>
        <Route
          index
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
