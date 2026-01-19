import React, { Suspense, useEffect, useState } from "react";
import {
  useLoaderData,
  Form,
  useActionData,
  defer,
  Await,
  useSearchParams,
  useNavigation,
} from "react-router-dom";
import { requireAuth } from "../../api/administration/authenticationApi";
import ContentThrobber from "../../components/throbbers/ContentThrobber";
import SessionTimoutError from "../../components/SessionTimeoutError";
import {
  addUser,
  searchUsers,
  deleteUser,
  editUser,
} from "../../api/administration/usersApi";
import ServerMessageToast from "../../components/ServerMessageToast";
import {
  validateInputText,
  validateInputTextNoUpperCase,
} from "../../utils/StringUtils";
import { pushToast } from "../../utils/ToastBus";
import ViewUserDialog from "../../components/users/ViewUserDialog";
import AddUserDialog from "../../components/users/AddUserDialog";
import DeleteUserDialog from "../../components/users/DeleteUserDialog";
import EditUserDialog from "../../components/users/EditUserDialog";
import { getPaletteStyleForGroup, loadStore } from "../../utils/GroupColors";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "userId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const usersDataAPI = await searchUsers(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
  );

  const usersData = { usersDataAPI, authentication };
  return defer(usersData);
}

export async function action({ request }) {
  const formData = await request.formData();
  if (formData.get("formType") === "addUser") {
    const fullName = formData.get("fullName");
    const userEmail = formData.get("userEmail");
    const userGroupId = formData.get("userGroupId");
    const password = formData.get("password");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let response = { errors: [] };

    if (fullName === null || fullName === "") {
      response.errors.push({
        name: "addFullName",
        message: "Please enter a valid full name.",
      });
    }
    if (userEmail === null || userEmail === "" || !emailRegex.test(userEmail)) {
      response.errors.push({
        name: "adduserEmail",
        message: "Please enter a valid email.",
      });
    }
    if (userGroupId === null || userGroupId === "") {
      response.errors.push({
        name: "adduserGroupId",
        message: "Please select a user group.",
      });
    }

    if (password === null || password === "") {
      response.errors.push({
        name: "addPassword",
        message: "Please enter a valid password.",
      });
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: "addUsers" };
      return response;
    } else {
      let addUserResponse = await addUser(
        fullName,
        userEmail,
        userGroupId,
        password,
      );
      if (addUserResponse !== null) {
        addUserResponse = { ...addUserResponse, formType: "addUsers" };
        return addUserResponse;
      }
      return null;
    }
  }
  if (formData.get("formType") === "deleteUser") {
    const userId = formData.get("userId");
    const batchNo = formData.get("batchNo");
    if (userId === null || userId === "") {
      return null;
    } else if (batchNo === null || batchNo === "") {
      return null;
    } else {
      let deleteUserResponse = await deleteUser(userId, batchNo);
      if (deleteUserResponse !== null) {
        deleteUserResponse = { ...deleteUserResponse, formType: "deleteUsers" };
        return deleteUserResponse;
      }
      return null;
    }
  }
  if (formData.get("formType") === "editUser") {
    const fullName = formData.get("fullName");
    const userEmail = formData.get("userEmail");
    const userGroupId = formData.get("userGroupId");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const userId = formData.get("userId");
    const batchNo = formData.get("batchNo");
    let response = { errors: [] };

    if (fullName === null || fullName === "") {
      response.errors.push({
        name: "editFullName",
        message: "Please enter a valid full name.",
      });
    }
    if (userEmail === null || userEmail === "" || !emailRegex.test(userEmail)) {
      response.errors.push({
        name: "edituserEmail",
        message: "Please enter a valid email.",
      });
    }
    if (userGroupId === null || userGroupId === "") {
      response.errors.push({
        name: "edituserGroupId",
        message: "Please select a user group.",
      });
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: "editUsers" };
      return response;
    } else {
      if (userId === null || userId === "") {
        return null;
      } else if (batchNo === null || batchNo === "") {
        return null;
      } else {
        let editUserResponse = await editUser(
          fullName,
          userEmail,
          userGroupId,
          userId,
          batchNo,
        );
        if (editUserResponse !== null) {
          editUserResponse = {
            ...editUserResponse,
            formType: "editUsers",
          };
          return editUserResponse;
        }
        return null;
      }
    }
  }
  return null;
}

export default function Users() {
  const { usersDataAPI, authentication } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchForm, setSearchForm] = useState({
    searchBy: searchParams.get("searchBy") || "userId",
    searchValue: searchParams.get("searchValue") || "",
    sortType: searchParams.get("sortType") || "created",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });
  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "userId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
      };
    });
  }, [searchParams]);

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
    userId: "",
    userEmail: "",
    fullName: "",
    created: "",
    createdBy: "",
    lastModified: "",
    lastModifiedBy: "",
    userGroup: {
      userGroupId: "",
      userGroupDescription: "",
    },
  });
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const response = useActionData();
  const errors = {
    add: {
      addFullNameError: response?.errors?.filter(
        (o) => o.name === "addFullName",
      ),
      adduserEmailError: response?.errors?.filter(
        (o) => o.name === "adduserEmail",
      ),
      adduserGroupIdError: response?.errors?.filter(
        (o) => o.name === "adduserGroupId",
      ),

      addPasswordError: response?.errors?.filter(
        (o) => o.name === "addPassword",
      ),
    },
    edit: {
      editFullNameError: response?.errors?.filter(
        (o) => o.name === "editFullName",
      ),
      edituserEmailError: response?.errors?.filter(
        (o) => o.name === "edituserEmail",
      ),
      edituserGroupIdError: response?.errors?.filter(
        (o) => o.name === "edituserGroupId",
      ),
    },
  };
  const navigation = useNavigation();
  useEffect(() => {
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      console.log(response);
      if (response.formType === "addUsers" && response.message.success) {
        setIsAddOpen(false);
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "deleteUsers" && response.message.success) {
        document.getElementById("deleteUserModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "editUsers" && response.message.success) {
        document.getElementById("editUserModalClose").click();
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
      userId: "",
      userEmail: "",
      fullName: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      userGroup: {
        userGroupId: "",
        userGroupDescription: "",
      },
      hidden: {
        email: "",
        password: "",
      },
    }));
  }

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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
                <Await resolve={usersDataAPI}>
                  {({ data }) => {
                    const { authorities, pagination, objects, userGroups } =
                      data;
                    const paletteStore = loadStore();
                    const dataGrid = objects.map((user) => {
                      const resolvedDescription =
                        user.userGroup.userGroupDescription ||
                        (userGroups || []).find(
                          (g) => g.id === user.userGroup.userGroupId,
                        )?.description ||
                        "USER";
                      const ug = (resolvedDescription || "USER").toUpperCase();
                      const pillClass = ug.includes("ADMIN")
                        ? "group-admin"
                        : ug.includes("MANAGER")
                          ? "group-manager"
                          : ug.includes("MODERATOR")
                            ? "group-moderator"
                            : "group-user";
                      const pillStyle =
                        pillClass === "group-user"
                          ? getPaletteStyleForGroup(
                              String(
                                user.userGroup.userGroupId ||
                                  user.userGroup.userGroupDescription ||
                                  "group",
                              ),
                              paletteStore,
                            )
                          : undefined;
                      return (
                        <tr key={user.userId}>
                          <td>
                            <strong>{user.userId}</strong>
                          </td>
                          <td>{user.fullName}</td>
                          <td>{user.userEmail}</td>
                          <td>
                            <span
                              className={`group-pill ${pillClass}`}
                              style={pillStyle}
                            >
                              {resolvedDescription}
                            </span>
                          </td>
                          <td>
                            <div className="list-actions">
                              <button
                                type="button"
                                className="action-icon view"
                                title="View"
                                disabled={!user.authorities.view}
                                value={user.userId}
                                onClick={() => openView(user.userId)}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <button
                                type="button"
                                className="action-icon edit"
                                title="Edit"
                                data-bs-toggle="modal"
                                data-bs-target="#editUserModal"
                                disabled={!user.authorities.edit}
                                value={user.userId}
                                onClick={() => {
                                  loadModalData(user.userId);
                                  setIsEditOpen(true);
                                }}
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                type="button"
                                className="action-icon delete"
                                title="Delete"
                                disabled={!user.authorities.delete}
                                value={user.userId}
                                onClick={() => openDelete(user.userId)}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    const userGroupDropDown = userGroups.map((userGroup) => {
                      return (
                        <option key={userGroup.id} value={userGroup.id}>
                          {userGroup.description}
                        </option>
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
                            <td>&nbsp;</td>
                          </tr>,
                        );
                      }
                      return dataGrid;
                    }

                    function loadModalData(userId) {
                      setModal(() => {
                        const user = objects.filter(
                          (user) => user.userId === userId,
                        );
                        console.log(user);
                        return {
                          ...user[0],
                          hidden: {
                            ...user[0].hidden,

                            password: "",
                          },
                          static: {
                            username: user[0].username,
                          },
                        };
                      });
                    }
                    function openView(userId) {
                      loadModalData(userId);
                      setIsViewOpen(true);
                    }
                    function openDelete(userId) {
                      loadModalData(userId);
                      setIsDeleteOpen(true);
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
                                      Users Management
                                    </h2>
                                    <p className="list-subtitle">
                                      Manage and organize your user accounts
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
                                    <i className="fa-solid fa-user-plus"></i>
                                    Add New User
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
                                      <option value="userId">User ID</option>
                                      <option value="userEmail">Email</option>
                                      <option value="fullName">
                                        Full Name
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
                                            <span>User ID</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType === "userId"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "userId",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "userId" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
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
                                            <span>Full Name</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType === "fullName"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "fullName",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "fullName" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
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
                                            <span>Email</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType ===
                                                    "userEmail"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "userEmail",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "userEmail" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
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
                                            <span>User Group</span>
                                            <button
                                              type="submit"
                                              form="searchForm"
                                              className="action-icon view"
                                              title="Sort"
                                              onClick={() => {
                                                setSearchForm((prev) => {
                                                  const sortOrder =
                                                    prev.sortType ===
                                                    "userGroup"
                                                      ? prev.sortOrder ===
                                                        "desc"
                                                        ? "asc"
                                                        : "desc"
                                                      : "asc";
                                                  return {
                                                    ...prev,
                                                    sortType: "userGroup",
                                                    sortOrder,
                                                  };
                                                });
                                              }}
                                            >
                                              <i
                                                className={`fa-solid ${searchForm.sortType === "userGroup" ? (searchForm.sortOrder === "asc" ? "fa-caret-up" : "fa-caret-down") : "fa-sort"}`}
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
                                            colSpan="5"
                                            style={{
                                              textAlign: "center",
                                              padding: "24px",
                                            }}
                                          >
                                            <span style={{ color: "#64748b" }}>
                                              No users found
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

                        {/* View Dialog */}
                        {/* Add Dialog */}
                        {(() => {
                          const userGroupOptions = userGroupDropDown;
                          return (
                            <AddUserDialog
                              isOpen={isAddOpen}
                              onClose={() => setIsAddOpen(false)}
                              modal={modal}
                              setModal={setModal}
                              userGroupOptions={userGroupOptions}
                              errors={errors}
                            />
                          );
                        })()}
                        {(() => {
                          const userGroupOptions = userGroupDropDown;
                          return (
                            <EditUserDialog
                              isOpen={isEditOpen}
                              onClose={() => setIsEditOpen(false)}
                              modal={modal}
                              setModal={setModal}
                              userGroupOptions={userGroupOptions}
                              errors={errors}
                            />
                          );
                        })()}
                        {(() => {
                          const userForDialog = modal?.userId
                            ? {
                                id: modal.userId,
                                fullName: modal.fullName,
                                email: modal.userEmail,
                                userGroup:
                                  modal?.userGroup?.userGroupDescription ||
                                  "USER",
                                created: modal.created,
                                createdBy: modal.createdBy,
                                lastModified: modal.lastModified,
                                lastModifiedBy: modal.lastModifiedBy,
                                batchNo: modal.batchNo,
                              }
                            : null;
                          return (
                            <ViewUserDialog
                              isOpen={isViewOpen}
                              onClose={() => setIsViewOpen(false)}
                              user={userForDialog}
                            />
                          );
                        })()}

                        {(() => {
                          const userForDialog = modal?.userId
                            ? {
                                id: modal.userId,
                                fullName: modal.fullName,
                                email: modal.userEmail,
                                userGroup:
                                  modal?.userGroup?.userGroupDescription ||
                                  "USER",
                                created: modal.created,
                                createdBy: modal.createdBy,
                                lastModified: modal.lastModified,
                                lastModifiedBy: modal.lastModifiedBy,
                                batchNo: modal.batchNo,
                              }
                            : null;
                          return (
                            <DeleteUserDialog
                              isOpen={isDeleteOpen}
                              onClose={() => setIsDeleteOpen(false)}
                              user={userForDialog}
                              isSubmitting={navigation.state === "submitting"}
                            />
                          );
                        })()}

                        {/* Global toasts are rendered in layout via ToastBus */}
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
