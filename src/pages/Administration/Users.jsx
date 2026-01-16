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
    sortOrder
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
        password
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
          batchNo
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
  const response = useActionData();
  const errors = {
    add: {
      addFullNameError: response?.errors?.filter(
        (o) => o.name === "addFullName"
      ),
      adduserEmailError: response?.errors?.filter(
        (o) => o.name === "adduserEmail"
      ),
      adduserGroupIdError: response?.errors?.filter(
        (o) => o.name === "adduserGroupId"
      ),

      addPasswordError: response?.errors?.filter(
        (o) => o.name === "addPassword"
      ),
    },
    edit: {
      editFullNameError: response?.errors?.filter(
        (o) => o.name === "editFullName"
      ),
      edituserEmailError: response?.errors?.filter(
        (o) => o.name === "edituserEmail"
      ),
      edituserGroupIdError: response?.errors?.filter(
        (o) => o.name === "edituserGroupId"
      ),
    },
  };
  const navigation = useNavigation();
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      console.log(response);
      if (response.formType === "addUsers" && response.message.success) {
        document.getElementById("addUserModalClose").click();
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
    setToasts((prevToasts) => {
      const newTosts = prevToasts.map((x) => x);
      newTosts.unshift(
        <ServerMessageToast
          key={prevToasts.length + 1}
          message={response?.message}
          id={prevToasts.length + 1}
        />
      );
      return newTosts;
    });
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
                    const dataGrid = objects.map((user) => {
                      return (
                        <tr key={user.userId}>
                          <td className="text-truncate">{user.userId}</td>
                          <td className="text-truncate">{user.fullName}</td>
                          <td className="text-truncate">{user.userEmail}</td>
                          <td className="text-truncate">
                            {user.userGroup.userGroupDescription}
                          </td>
                          <td>
                            <div className="row">
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="View"
                                  data-bs-toggle="modal"
                                  data-bs-target="#viewUserModal"
                                  disabled={!user.authorities.view}
                                  value={user.userId}
                                  onClick={() => loadModalData(user.userId)}
                                >
                                  <i className="fa-sharp fa-solid fa-eye"></i>
                                </button>
                              </div>
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="Edit"
                                  data-bs-toggle="modal"
                                  data-bs-target="#editUserModal"
                                  disabled={!user.authorities.edit}
                                  value={user.userId}
                                  onClick={() => loadModalData(user.userId)}
                                >
                                  <i className="fa-sharp fa-solid fa-pen"></i>
                                </button>
                              </div>
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  title="Delete"
                                  data-bs-toggle="modal"
                                  data-bs-target="#deleteUserModal"
                                  disabled={!user.authorities.delete}
                                  value={user.userId}
                                  onClick={() => loadModalData(user.userId)}
                                >
                                  <i className="fa-sharp fa-solid fa-trash"></i>
                                </button>
                              </div>
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
                          </tr>
                        );
                      }
                      return dataGrid;
                    }

                    function loadModalData(userId) {
                      setModal(() => {
                        const user = objects.filter(
                          (user) => user.userId === userId
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
                    return (
                      <>
                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 mb-3 align-items-center user-content">
                                <div className="col">
                                  <h4 className="page-header user-heading">
                                    Users Management
                                  </h4>
                                </div>
                                <div className="col text-end add-btn">
                                  <button
                                    className="btn btn-theme btn-sm"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addUserModal"
                                    disabled={!authorities.add}
                                    onClick={clearModalData}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;User&nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                              <div className="row justify-content-end mb-3">
                                <div className="col col-xxl-3">
                                  <div className="row align-items-center">
                                    <div className="col search-by-col-1 text-end">
                                      <label
                                        className="fw-bold"
                                        htmlFor="searchBy"
                                      >
                                        Search by:{" "}
                                      </label>
                                    </div>
                                    <div className="col col-sm-4 search-by-col-2">
                                      <select
                                        form="searchForm"
                                        name="searchBy"
                                        className="form-select form-select-sm form-select-mod"
                                        value={searchForm.searchBy}
                                        onChange={(event) => {
                                          setSearchForm((prevSearchForm) => {
                                            return {
                                              ...prevSearchForm,
                                              searchBy: event.target.value,
                                            };
                                          });
                                        }}
                                      >
                                        <option value="userId">User ID</option>
                                        <option value="userEmail">Email</option>
                                        <option value="fullName">
                                          Full Name
                                        </option>
                                        <option value="userGroups">
                                          User Group
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="col col-md-3">
                                  <Form
                                    id="searchForm"
                                    className="d-flex"
                                    method="get"
                                  >
                                    <div className="input-group input-group-sm">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm input-group-control-mod form-input-mod"
                                        placeholder="Search..."
                                        aria-describedby="basic-addon2"
                                        name="searchValue"
                                        value={searchForm.searchValue || ""}
                                        onChange={(event) => {
                                          setSearchForm((prevSearchForm) => {
                                            return {
                                              ...prevSearchForm,
                                              searchValue: validateInputText(
                                                event.target.value
                                              ),
                                            };
                                          });
                                        }}
                                      />
                                      <span
                                        className="input-group-text input-group-text-mod form-input-mod"
                                        id="basic-addon2"
                                      >
                                        <button
                                          className="action-btn"
                                          type="submit"
                                          onClick={() => {
                                            setSearchForm((prevSearchForm) => {
                                              return {
                                                ...prevSearchForm,
                                                sortType: "created",
                                                sortOrder: "desc",
                                                page: "1",
                                              };
                                            });
                                          }}
                                        >
                                          <i className="fa-sharp fa-solid fa-magnifying-glass fa-sm"></i>
                                        </button>
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
                                      </span>
                                    </div>
                                  </Form>
                                </div>
                              </div>
                              <div className="row table-row mb-3">
                                <div className="col table-responsive bg-theme-1 border rounded table-container">
                                  <table className="table table-hover">
                                    <thead>
                                      <tr>
                                        <th>
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              User&nbsp;ID
                                            </div>
                                            <div className="col sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "userId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "userId",
                                                        sortOrder: sortOrder,
                                                      };
                                                    }
                                                  );
                                                }}
                                                className="sort-btn"
                                              >
                                                <i
                                                  className={`fa-sharp fa-solid ${
                                                    searchForm.sortType ===
                                                    "userId"
                                                      ? searchForm.sortOrder ===
                                                        "asc"
                                                        ? "fa-caret-up"
                                                        : "fa-caret-down"
                                                      : "fa-sort"
                                                  }`}
                                                ></i>
                                              </button>
                                            </div>
                                          </div>
                                        </th>
                                        <th>
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Full Name
                                            </div>
                                            <div className="col sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "fullName"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "fullName",
                                                        sortOrder: sortOrder,
                                                      };
                                                    }
                                                  );
                                                }}
                                                className="sort-btn"
                                              >
                                                <i
                                                  className={`fa-sharp fa-solid ${
                                                    searchForm.sortType ===
                                                    "fullName"
                                                      ? searchForm.sortOrder ===
                                                        "asc"
                                                        ? "fa-caret-up"
                                                        : "fa-caret-down"
                                                      : "fa-sort"
                                                  }`}
                                                ></i>
                                              </button>
                                            </div>
                                          </div>
                                        </th>
                                        <th>
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Email
                                            </div>
                                            <div className="col sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "userEmail"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "userEmail",
                                                        sortOrder: sortOrder,
                                                      };
                                                    }
                                                  );
                                                }}
                                                className="sort-btn"
                                              >
                                                <i
                                                  className={`fa-sharp fa-solid ${
                                                    searchForm.sortType ===
                                                    "userEmail"
                                                      ? searchForm.sortOrder ===
                                                        "asc"
                                                        ? "fa-caret-up"
                                                        : "fa-caret-down"
                                                      : "fa-sort"
                                                  }`}
                                                ></i>
                                              </button>
                                            </div>
                                          </div>
                                        </th>
                                        <th>
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              User&nbsp;Group
                                            </div>
                                            <div className="col sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "userGroup"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "userGroup",
                                                        sortOrder: sortOrder,
                                                      };
                                                    }
                                                  );
                                                }}
                                                className="sort-btn"
                                              >
                                                <i
                                                  className={`fa-sharp fa-solid ${
                                                    searchForm.sortType ===
                                                    "userGroup"
                                                      ? searchForm.sortOrder ===
                                                        "asc"
                                                        ? "fa-caret-up"
                                                        : "fa-caret-down"
                                                      : "fa-sort"
                                                  }`}
                                                ></i>
                                              </button>
                                            </div>
                                          </div>
                                        </th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>{dataGridOffset(dataGrid)}</tbody>
                                  </table>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col">
                                  <small className="pagination-text">
                                    Showing{" "}
                                    {pagination.count === 0 &&
                                    pagination.count === 0
                                      ? 0
                                      : pagination.page * 10 - 9}{" "}
                                    -{" "}
                                    {Math.min(
                                      10 * pagination.page,
                                      pagination.count
                                    )}{" "}
                                    of {pagination.count} Results
                                  </small>
                                </div>
                                <div className="col">
                                  <nav>
                                    <ul className="pagination pagination-sm justify-content-end align-items-center pagination-color-fix">
                                      <li className="page-item">
                                        <button
                                          type="submit"
                                          form="searchForm"
                                          className="page-link"
                                          onClick={() => {
                                            setSearchForm((prevSearchForm) => {
                                              const page = (
                                                pagination.page - 1
                                              ).toString();
                                              return {
                                                ...prevSearchForm,
                                                page: page,
                                              };
                                            });
                                          }}
                                          value={pagination.page - 1}
                                          disabled={pagination.page === 1}
                                        >
                                          Previous
                                        </button>
                                      </li>
                                      <li className="page-item">
                                        <span className="active-page border-top border-bottom">
                                          {pagination.page}
                                        </span>
                                      </li>
                                      <li className="page-item">
                                        <button
                                          type="submit"
                                          form="searchForm"
                                          onClick={() => {
                                            setSearchForm((prevSearchForm) => {
                                              const page = (
                                                pagination.page + 1
                                              ).toString();
                                              return {
                                                ...prevSearchForm,
                                                page: page,
                                              };
                                            });
                                          }}
                                          className="page-link"
                                          disabled={
                                            10 * pagination.page >=
                                            pagination.count
                                          }
                                        >
                                          Next
                                        </button>
                                      </li>
                                    </ul>
                                  </nav>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                        <div
                          className="modal modal-adjuster fade"
                          id="viewUserModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <div>
                                  <h4 className="page-header">
                                    Users Management | View
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                ></button>
                              </div>
                              <div className="modal-body">
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userId}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Full Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.fullName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userEmail}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User Group
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroup.userGroupDescription}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Created Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.created}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Created By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.createdBy}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Last Modified Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.lastModified}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Last modified By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {" "}
                                        {modal.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="modal modal-adjuster fade"
                          id="deleteUserModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <div>
                                  <h4 className="page-header">
                                    Users Management | Confirm Delete
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  id="deleteUserModalClose"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userId}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Full Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.fullName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userEmail}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User Group
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroup.userGroupDescription}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Created Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.created}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Created By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {" "}
                                        {modal.createdBy}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Last Modified Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.lastModified}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Last modified By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {" "}
                                        {modal.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <Form method="post">
                                    <input
                                      type="hidden"
                                      name="userId"
                                      value={modal.userId}
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="batchNo"
                                      value={modal.batchNo}
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="deleteUser"
                                      readOnly={true}
                                    />
                                    <button
                                      type="submit"
                                      className="btn btn-theme-delete btn-sm"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    >
                                      &nbsp;
                                      <i className="fa-sharp fa-solid fa-trash"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Delete User"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                  </Form>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Add modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="addUserModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <div>
                                  <h4 className="page-header">
                                    Users Management | Add
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  className="btn-close"
                                  id="addUserModalClose"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <Form id="addUsersForm" method="post">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="addfullName"
                                      className="form-label fw-bold"
                                    >
                                      Full Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="addfullName"
                                      name="fullName"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={modal.fullName}
                                      onChange={(event) => {
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            fullName:
                                              validateInputTextNoUpperCase(
                                                event.target.value
                                              ),
                                          };
                                        });
                                      }}
                                    />
                                    {errors.add.addFullNameError &&
                                      errors.add.addFullNameError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.addFullNameError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="addemail"
                                      className="form-label fw-bold"
                                    >
                                      Email
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="addemail"
                                      name="userEmail"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={modal.userEmail}
                                      onChange={(event) => {
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            userEmail:
                                              validateInputTextNoUpperCase(
                                                event.target.value
                                              ),
                                          };
                                        });
                                      }}
                                    />
                                    {errors.add.adduserEmailError &&
                                      errors.add.adduserEmailError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.adduserEmailError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="adduserGroup"
                                      className="form-label fw-bold"
                                    >
                                      User Group
                                    </label>
                                    <select
                                      id="adduserGroup"
                                      name="userGroupId"
                                      className="form-select form-select-mod"
                                      value={modal.userGroupId}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      onChange={(event) => {
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            userGroupId: event.target.value,
                                          };
                                        });
                                      }}
                                    >
                                      <option disabled value=""></option>
                                      {userGroupDropDown}
                                    </select>
                                    {errors.add.adduserGroupIdError &&
                                      errors.add.adduserGroupIdError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.adduserGroupIdError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="addPassword"
                                      className="form-label fw-bold"
                                    >
                                      Account Password
                                    </label>
                                    <input
                                      type="text"
                                      autoComplete="off"
                                      className="form-control form-input-mod ff-hidden"
                                      id="addPassword"
                                      name="password"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={modal.password}
                                      onChange={(event) => {
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            hidden: {
                                              ...prevModal.hidden,
                                              password:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            },
                                          };
                                        });
                                      }}
                                    />
                                    {errors.add.addPasswordError &&
                                      errors.add.addPasswordError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.addPasswordError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                    <div
                                      id="passwordDisclaimer"
                                      className="form-text"
                                    >
                                      The account password can only be
                                      administratively set{" "}
                                      <strong>during account creation</strong>.
                                    </div>
                                  </div>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="addUser"
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    className="btn btn-theme btn-sm"
                                    form="addUsersForm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add New User"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Edit modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="editUserModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <div>
                                  <h4 className="page-header">
                                    Users Management | Edit
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="editUserModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <Form id="editUsersForm" method="post">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="editfullName"
                                      className="form-label fw-bold"
                                    >
                                      Full Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="editfullName"
                                      name="fullName"
                                      value={modal.fullName}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      onChange={(event) => {
                                        setModal((prevModal) => ({
                                          ...prevModal,
                                          fullName:
                                            validateInputTextNoUpperCase(
                                              event.target.value
                                            ),
                                          hidden: {
                                            ...prevModal.hidden,
                                          },
                                        }));
                                      }}
                                    />
                                    {errors.edit.editFullNameError &&
                                      errors.edit.editFullNameError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit.editFullNameError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="editemail"
                                      className="form-label fw-bold"
                                    >
                                      Email
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="editemail"
                                      name="userEmail"
                                      value={modal.userEmail}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      onChange={(event) => {
                                        setModal((prevModal) => ({
                                          ...prevModal,
                                          userEmail:
                                            validateInputTextNoUpperCase(
                                              event.target.value
                                            ),
                                          hidden: {
                                            ...prevModal.hidden,
                                          },
                                        }));
                                      }}
                                    />
                                    {errors.edit.edituserEmailError &&
                                      errors.edit.edituserEmailError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit.edituserEmailError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="edituserGroup"
                                      className="form-label fw-bold"
                                    >
                                      User Group
                                    </label>
                                    <select
                                      id="edituserGroup"
                                      name="userGroupId"
                                      className="form-select form-select-mod"
                                      value={
                                        userGroups.filter(
                                          (userGroup) =>
                                            userGroup.id === modal.userGroupId
                                        )[0]?.id
                                      }
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      onChange={(event) => {
                                        setModal((prevModal) => ({
                                          ...prevModal,
                                          userGroupId: event.target.value,
                                          hidden: {
                                            ...prevModal.hidden,
                                          },
                                        }));
                                      }}
                                    >
                                      <option disabled value=""></option>
                                      {userGroupDropDown}
                                    </select>
                                    {errors.edit.edituserGroupIdError &&
                                      errors.edit.edituserGroupIdError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit.edituserGroupIdError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="editUser"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="userId"
                                    value={modal.userId}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="batchNo"
                                    value={modal.batchNo}
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    className="btn btn-theme btn-sm"
                                    form="editUsersForm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-pen"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Edit User"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="toast-container toast-positioner">
                          {toasts}
                        </div>
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
