// user groups
import React, { Suspense, useEffect, useState } from "react";
import {
  Form,
  useLoaderData,
  useActionData,
  useSearchParams,
  redirect,
  defer,
  Await,
  useNavigation,
} from "react-router-dom";
import { requireAuth } from "../../api/administration/authenticationApi";
import ContentThrobber from "../../components/throbbers/ContentThrobber";
import SessionTimoutError from "../../components/SessionTimeoutError";
import {
  searchUserGroups,
  addUserGroup,
  editUserGroup,
  deleteUserGroup,
} from "../../api/administration/userGroupsApi";
import ServerMessageToast from "../../components/ServerMessageToast";
import { validateInputText } from "../../utils/StringUtils";
import { pushToast } from "../../utils/ToastBus";
import ViewUserGroup from "../../components/user-groups/ViewUserGroup";
import DeleteUserGroup from "../../components/user-groups/DeleteUserGroup";
import AddUserGroup from "../../components/user-groups/AddUserGroup";

export async function loader({ request }) {
  const authentication = requireAuth();
  const url = new URL(request.url);
  const searchBy = url.searchParams.get("searchBy") || "userGroupId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const userGroupsDataAPI = await searchUserGroups(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
  );

  const userGroupsData = { authentication, userGroupsDataAPI };
  return defer(userGroupsData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");

  // Common validation logic
  let response = { errors: [] };

  if (formType === "addUserGroup") {
    const userGroupDescription = formData.get("userGroupDescription");
    const accessDuration = formData.get("accessDuration");
    const modulePrivileges = JSON.parse(formData.get("modulePrivileges")) || [];

    if (!userGroupDescription) {
      response.errors.push({
        name: "adduserGroupDescription",
        message: "Please enter a valid description.",
      });
    }

    if (
      accessDuration === null ||
      accessDuration === "" ||
      isNaN(accessDuration) ||
      accessDuration < 0
    ) {
      response.errors.push({
        name: "addAccessDuration",
        message: "Please enter a valid access duration.",
      });
    }

    if (modulePrivileges.length === 0) {
      response.errors.push({
        name: "addModulePrivileges",
        message: "Module level privileges are empty.",
      });
    }

    if (response.errors.length) {
      return { ...response, formType: "addUserGroups" };
    } else {
      let addUserGroupResponse = await addUserGroup(
        userGroupDescription,
        accessDuration,
        modulePrivileges,
      );
      if (addUserGroupResponse) {
        return { ...addUserGroupResponse, formType: "addUserGroups" };
      }
    }
  }

  if (formType === "editUserGroup") {
    const userGroupDescription = formData.get("userGroupDescription");
    const accessDuration = formData.get("accessDuration");
    const userGroupId = formData.get("userGroupId");
    const batchNo = formData.get("batchNo");

    if (!userGroupDescription) {
      response.errors.push({
        name: "edituserGroupDescription",
        message: "Please enter a valid description.",
      });
    }

    if (
      accessDuration === null ||
      accessDuration === "" ||
      isNaN(accessDuration) ||
      accessDuration < 0
    ) {
      response.errors.push({
        name: "editAccessDuration",
        message: "Please enter a valid access duration.",
      });
    }

    if (response.errors.length) {
      return { ...response, formType: "editUserGroups" };
    } else if (userGroupId && batchNo) {
      let editUserGroupResponse = await editUserGroup(
        userGroupId,
        userGroupDescription,
        accessDuration,
        batchNo,
      );
      if (editUserGroupResponse) {
        return { ...editUserGroupResponse, formType: "editUserGroups" };
      }
    }
  }

  if (formType === "deleteUserGroup") {
    const userGroupId = formData.get("userGroupId");
    const batchNo = formData.get("batchNo");

    if (userGroupId && batchNo) {
      let deleteUserGroupResponse = await deleteUserGroup(userGroupId, batchNo);
      if (deleteUserGroupResponse) {
        return { ...deleteUserGroupResponse, formType: "deleteUserGroups" };
      }
    }
  }

  return null;
}

export default function UserGroups() {
  const { authentication, userGroupsDataAPI } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchForm, setSearchForm] = useState({
    searchBy: searchParams.get("searchBy") || "userGroupId",
    searchValue: searchParams.get("searchValue") || "",
    sortType: searchParams.get("sortType") || "created",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modal, setModal] = useState({
    authorities: {
      add: false,
      edit: false,
      delete: false,
      view: false,
      privileges: false,
      update: false,
      resetPassword: false,
    },
    batchNo: "",
    created: "",
    createdBy: "",
    lastModified: "",
    lastModifiedBy: "",
    userGroupId: "",
    userGroupDescription: "",
    accessDuration: "",
    numberOfUsers: "",
    modulePrivileges: [],
  });
  const response = useActionData();
  const errors = {
    add: {
      adduserGroupDescriptionError: response?.errors?.filter(
        (o) => o.name === "adduserGroupDescription",
      ),
      addAccessDurationError: response?.errors?.filter(
        (o) => o.name === "addAccessDuration",
      ),
    },
    edit: {
      edituserGroupDescriptionError: response?.errors?.filter(
        (o) => o.name === "edituserGroupDescription",
      ),
      editAccessDurationError: response?.errors?.filter(
        (o) => o.name === "editAccessDuration",
      ),
    },
  };
  const [modulePrivileges, setModulePrivileges] = useState([]);
  const [resetMP, setResetMP] = useState(false);

  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "userGroupId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
      };
    });
  }, [searchParams]);

  const navigation = useNavigation();

  useEffect(() => {
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (response.formType === "addUserGroups" && response.message.success) {
        document.getElementById("addUserGroupForm").reset();
        document.getElementById("addModalClose").click();
        clearModalData();
        setResetMP((prev) => !prev);
      }
      if (
        response.formType === "deleteUserGroups" &&
        response.message.success
      ) {
        document.getElementById("deleteUserGroupModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "editUserGroups" && response.message.success) {
        document.getElementById("editUseGrouprModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
    }
    if (response?.message) {
      pushToast(response.message);
    }
  }, [response]);

  function clearModalData() {
    setModal(() => ({
      authorities: {
        add: false,
        edit: false,
        delete: false,
        view: false,
        privileges: false,
        update: false,
        resetPassword: false,
      },
      batchNo: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      userGroupId: "",
      userGroupDescription: "",
      accessDuration: "",
      numberOfUsers: "",
      modulePrivileges: [],
    }));
    let newMP = modulePrivileges.map((x) => x);
    newMP = newMP.map((mp) => {
      mp.granted = false;
      return mp;
    });
    setModulePrivileges(() => {
      return newMP;
    });
  }

  return (
    <>
      <Suspense fallback={<ContentThrobber />}>
        <Await resolve={authentication}>
          {({ message }) => {
            if (!message.success) {
              return <SessionTimoutError />;
            }
            return (
              <>
                <Await resolve={userGroupsDataAPI}>
                  {({ data }) => {
                    const { authorities, pagination, objects, modules } = data;
                    useEffect(() => {
                      const newModulePrivileges = [];
                      modules.map((module) => {
                        const modulePrivilege = {
                          moduleId: module.id,
                          granted: false,
                        };
                        newModulePrivileges.push(modulePrivilege);
                      });
                      setModulePrivileges(() => newModulePrivileges);
                    }, []);

                    function loadModalData(userGroupId) {
                      setModal(() => {
                        const userGroup = objects.filter(
                          (userGroup) => userGroup.userGroupId === userGroupId,
                        );
                        return {
                          ...userGroup[0],
                          hidden: {
                            ...userGroup[0].hidden,
                          },
                        };
                      });
                    }
                    function openView(userGroupId) {
                      loadModalData(userGroupId);
                      setIsViewOpen(true);
                    }
                    function openDelete(userGroupId) {
                      loadModalData(userGroupId);
                      setIsDeleteOpen(true);
                    }

                    const dataGrid = objects.map((userGroup) => {
                      const ug = (
                        userGroup.userGroupDescription || ""
                      ).toUpperCase();
                      const pillClass = ug.includes("ADMIN")
                        ? "group-admin"
                        : ug.includes("MANAGER")
                          ? "group-manager"
                          : ug.includes("MODERATOR")
                            ? "group-moderator"
                            : "group-user";
                      return (
                        <tr key={userGroup.userGroupId}>
                          <td>
                            <strong>{userGroup.userGroupId}</strong>
                          </td>
                          <td>
                            <span className={`group-pill ${pillClass}`}>
                              {userGroup.userGroupDescription}
                            </span>
                          </td>
                          <td>{userGroup.numberOfUsers}</td>
                          <td>
                            <div className="list-actions">
                              <button
                                type="button"
                                className="action-icon view"
                                title="View"
                                data-bs-toggle="modal"
                                data-bs-target="#viewUserGroupModal"
                                disabled={!userGroup.authorities.view}
                                value={userGroup.userGroupId}
                                onClick={() => openView(userGroup.userGroupId)}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <Form
                                method="get"
                                action={`/privileges/${userGroup.userGroupId}`}
                                state={{
                                  search: `?${searchParams.toString()}`,
                                }}
                                style={{ display: "inline" }}
                              >
                                <button
                                  type="submit"
                                  className="action-icon privileges"
                                  title="Privileges"
                                  disabled={!userGroup.authorities.privileges}
                                  value={userGroup.userId}
                                >
                                  <i className="fa-solid fa-user-lock"></i>
                                </button>
                              </Form>
                              <button
                                type="button"
                                className="action-icon edit"
                                title="Edit"
                                data-bs-toggle="modal"
                                data-bs-target="#editUserGroupModal"
                                disabled={!userGroup.authorities.edit}
                                value={userGroup.userId}
                                onClick={() =>
                                  loadModalData(userGroup.userGroupId)
                                }
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                type="button"
                                className="action-icon delete"
                                title="Delete"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteUserGroupModal"
                                disabled={!userGroup.authorities.delete}
                                value={userGroup.userGroupId}
                                onClick={() =>
                                  openDelete(userGroup.userGroupId)
                                }
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    const modulePrivilegesChecklist = modules.map((module) => {
                      const modulePrivilege = modulePrivileges.filter(
                        (modulePrivilege) =>
                          modulePrivilege.moduleId === module.id,
                      )[0];
                      return (
                        <tr key={module.id}>
                          <td className="text-truncate align-middle">
                            {module.description}
                          </td>
                          <td className="text-truncate align-middle">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input form-switch-mod privilege-switch"
                                type="checkbox"
                                role="switch"
                                id={`granted-${module.id}`}
                                name={`granted-${module.id}`}
                                checked={modulePrivilege?.granted || false}
                                onChange={(event) => {
                                  setModulePrivileges((prev) => {
                                    prev[
                                      prev.indexOf(modulePrivilege)
                                    ].granted = event.target.checked;
                                    return prev.map((el) => el);
                                  });
                                }}
                                disabled={navigation.state === "submitting"}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    function dataGridOffset(dataGrid) {
                      for (let i = objects.length; i < 10; i++) {
                        dataGrid.push(
                          <tr key={i}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>,
                        );
                      }
                      return dataGrid;
                    }

                    return (
                      <>
                        <section className="secondary-page">
                          <div className="content">
                            <div className="container">
                              <div className="page-card">
                                <div className="list-header">
                                  <div>
                                    <h2 className="list-title">
                                      User Groups Management
                                    </h2>
                                    <p className="list-subtitle">
                                      Manage and organize user group permissions
                                    </p>
                                  </div>
                                  <button
                                    className="list-add-btn"
                                    type="button"
                                    disabled={!authorities.add}
                                    onClick={() => {
                                      clearModalData();
                                      setIsAddOpen(true);
                                    }}
                                  >
                                    <i className="fa-solid fa-users-plus"></i>
                                    Add New User Group
                                  </button>
                                </div>
                                <div className="list-controls">
                                  <div className="list-search-field">
                                    <label
                                      className="list-label"
                                      htmlFor="searchBy"
                                    >
                                      Search by:
                                    </label>
                                    <select
                                      form="searchForm"
                                      name="searchBy"
                                      className="list-select"
                                      value={searchForm.searchBy}
                                      onChange={(event) => {
                                        setSearchForm((prev) => ({
                                          ...prev,
                                          searchBy: event.target.value,
                                        }));
                                      }}
                                    >
                                      <option value="userGroupId">
                                        User Group ID
                                      </option>
                                      <option value="userGroupDescription">
                                        User Group Name
                                      </option>
                                    </select>
                                  </div>
                                  <Form
                                    id="searchForm"
                                    method="get"
                                    className="list-searchbox"
                                  >
                                    <i
                                      className="fa-solid fa-magnifying-glass list-input-icon"
                                      aria-hidden="true"
                                    ></i>
                                    <input
                                      type="text"
                                      className="list-input"
                                      placeholder="Search..."
                                      name="searchValue"
                                      value={searchForm.searchValue || ""}
                                      onChange={(event) => {
                                        setSearchForm((prev) => ({
                                          ...prev,
                                          searchValue: validateInputText(
                                            event.target.value,
                                          ),
                                        }));
                                      }}
                                    />
                                    <input
                                      type="hidden"
                                      name="sortType"
                                      value={searchForm.sortType || ""}
                                    />
                                    <input
                                      type="hidden"
                                      name="sortOrder"
                                      value={searchForm.sortOrder || ""}
                                    />
                                    <input
                                      type="hidden"
                                      name="page"
                                      value={searchForm.page || ""}
                                    />
                                  </Form>
                                </div>
                                <div className="list-table-wrap">
                                  <table className="list-table">
                                    <thead>
                                      <tr>
                                        <th>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <span>User Group ID</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType ===
                                                    "UserGroupId"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "UserGroupId",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "UserGroupId" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
                                              ></i>
                                            </button>
                                          </div>
                                        </th>
                                        <th>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <span>User Group Name</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType ===
                                                    "userGroupDescription"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType:
                                                      "userGroupDescription",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "userGroupDescription" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
                                              ></i>
                                            </button>
                                          </div>
                                        </th>
                                        <th>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <span>Number of Users</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType ===
                                                    "numberOfUsers"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "numberOfUsers",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "numberOfUsers" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
                                              ></i>
                                            </button>
                                          </div>
                                        </th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {objects.length > 0
                                        ? dataGridOffset(dataGrid)
                                        : null}
                                      {objects.length === 0 && (
                                        <tr>
                                          <td
                                            colSpan="4"
                                            style={{
                                              textAlign: "center",
                                              padding: "24px",
                                            }}
                                          >
                                            <span style={{ color: "#64748b" }}>
                                              No user groups found
                                            </span>
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="list-pagination">
                                  <div className="list-page-info">
                                    Showing{" "}
                                    {Math.min(
                                      pagination.count === 0
                                        ? 0
                                        : (pagination.page - 1) * 10 + 1,
                                      pagination.count,
                                    )}{" "}
                                    -{" "}
                                    {Math.min(
                                      10 * pagination.page,
                                      pagination.count,
                                    )}{" "}
                                    of {pagination.count} Results
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <button
                                      type="submit"
                                      form="searchForm"
                                      className="page-btn"
                                      onClick={() => {
                                        setSearchForm((prev) => ({
                                          ...prev,
                                          page: (
                                            pagination.page - 1
                                          ).toString(),
                                        }));
                                      }}
                                      disabled={pagination.page === 1}
                                    >
                                      Previous
                                    </button>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      {Array.from(
                                        {
                                          length: Math.max(
                                            1,
                                            Math.ceil(pagination.count / 10),
                                          ),
                                        },
                                        (_, i) => i + 1,
                                      ).map((page) => (
                                        <button
                                          key={page}
                                          type="submit"
                                          form="searchForm"
                                          onClick={() => {
                                            setSearchForm((prev) => ({
                                              ...prev,
                                              page: page.toString(),
                                            }));
                                          }}
                                          className={`page-number ${pagination.page === page ? "active" : ""}`}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      type="submit"
                                      form="searchForm"
                                      className="page-btn"
                                      onClick={() => {
                                        setSearchForm((prev) => ({
                                          ...prev,
                                          page: (
                                            pagination.page + 1
                                          ).toString(),
                                        }));
                                      }}
                                      disabled={
                                        10 * pagination.page >= pagination.count
                                      }
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {(() => {
                          const userGroupForDialog = modal?.userGroupId
                            ? {
                                userGroupId: modal.userGroupId,
                                userGroupDescription:
                                  modal.userGroupDescription,
                                accessDuration: modal.accessDuration,
                                created: modal.created,
                                createdBy: modal.createdBy,
                                lastModified: modal.lastModified,
                                lastModifiedBy: modal.lastModifiedBy,
                              }
                            : null;
                          return (
                            <ViewUserGroup
                              isOpen={isViewOpen}
                              onClose={() => setIsViewOpen(false)}
                              data={userGroupForDialog}
                            />
                          );
                        })()}
                        {(() => {
                          const userGroupForDialog = modal?.userGroupId
                            ? {
                                userGroupId: modal.userGroupId,
                                userGroupDescription:
                                  modal.userGroupDescription,
                                accessDuration: modal.accessDuration,
                                created: modal.created,
                                createdBy: modal.createdBy,
                                lastModified: modal.lastModified,
                                lastModifiedBy: modal.lastModifiedBy,
                                batchNo: modal.batchNo,
                              }
                            : null;
                          return (
                            <DeleteUserGroup
                              isOpen={isDeleteOpen}
                              onClose={() => setIsDeleteOpen(false)}
                              data={userGroupForDialog}
                              isSubmitting={navigation.state === "submitting"}
                            />
                          );
                        })()}
                        <AddUserGroup
                          isOpen={isAddOpen}
                          onClose={() => setIsAddOpen(false)}
                          modal={modal}
                          setModal={setModal}
                          modulePrivilegesChecklist={modulePrivilegesChecklist}
                          modulePrivileges={modulePrivileges}
                          errors={errors}
                        />
                      </>
                    );
                  }}
                </Await>
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}
