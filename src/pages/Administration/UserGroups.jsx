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
    sortOrder
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
        modulePrivileges
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
        batchNo
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
        (o) => o.name === "adduserGroupDescription"
      ),
      addAccessDurationError: response?.errors?.filter(
        (o) => o.name === "addAccessDuration"
      ),
    },
    edit: {
      edituserGroupDescriptionError: response?.errors?.filter(
        (o) => o.name === "edituserGroupDescription"
      ),
      editAccessDurationError: response?.errors?.filter(
        (o) => o.name === "editAccessDuration"
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
  const [toasts, setToasts] = useState([]);

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
                          (userGroup) => userGroup.userGroupId === userGroupId
                        );
                        return {
                          ...userGroup[0],
                          hidden: {
                            ...userGroup[0].hidden,
                          },
                        };
                      });
                    }

                    const dataGrid = objects.map((userGroup) => {
                      return (
                        <tr key={userGroup.userGroupId}>
                          <td className="text-truncate">
                            {userGroup.userGroupId}
                          </td>
                          <td className="text-truncate">
                            {userGroup.userGroupDescription}
                          </td>
                          <td className="text-truncate">
                            {userGroup.numberOfUsers}
                          </td>
                          <td>
                            <div className="row">
                              <div className="col col-2">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="View"
                                  data-bs-toggle="modal"
                                  data-bs-target="#viewUserGroupModal"
                                  disabled={!userGroup.authorities.view}
                                  value={userGroup.userId}
                                  onClick={() =>
                                    loadModalData(userGroup.userGroupId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-eye"></i>
                                </button>
                              </div>
                              <div className="col col-2">
                                <Form
                                  method="get"
                                  action={`/privileges/${userGroup.userGroupId}`}
                                  state={{
                                    search: `?${searchParams.toString()}`,
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="action-btn"
                                    title="Privileges"
                                    disabled={!userGroup.authorities.privileges}
                                    value={userGroup.userId}
                                  >
                                    <i className="fa-sharp fa-solid fa-user-lock"></i>
                                  </button>
                                </Form>
                              </div>
                              <div className="col col-2">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="Edit"
                                  data-bs-toggle="modal"
                                  data-bs-target="#editUserGroupModal"
                                  disabled={!userGroup.authorities.delete}
                                  value={userGroup.userId}
                                  onClick={() =>
                                    loadModalData(userGroup.userGroupId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-pen"></i>
                                </button>
                              </div>
                              <div className="col col-2">
                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  title="Delete"
                                  data-bs-toggle="modal"
                                  data-bs-target="#deleteUserGroupModal"
                                  disabled={!userGroup.authorities.view}
                                  value={userGroup.userId}
                                  onClick={() =>
                                    loadModalData(userGroup.userGroupId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    const modulePrivilegesChecklist = modules.map((module) => {
                      const modulePrivilege = modulePrivileges.filter(
                        (modulePrivilege) =>
                          modulePrivilege.moduleId === module.id
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
                          </tr>
                        );
                      }
                      return dataGrid;
                    }

                    return (
                      <>
                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 mb-3 align-items-center user-content">
                                <div className="col">
                                  <h4 className="page-header  user-heading">
                                    User Groups Management
                                  </h4>
                                </div>
                                <div className="col text-end add-btn">
                                  <button
                                    type="button"
                                    className="btn btn-theme btn-sm"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addUserGroupModal"
                                    disabled={!authorities.add}
                                    onClick={clearModalData}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;User&nbsp;Group&nbsp;&nbsp;&nbsp;
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
                                        <option value="userGroupId">
                                          User Group ID
                                        </option>
                                        <option value="userGroupDescription">
                                          User Group Name
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
                                              User&nbsp;Group&nbsp;ID
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
                                                        "UserGroupId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "UserGroupId",
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
                                                    "UserGroupId"
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
                                              User&nbsp;Group&nbsp;Name
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
                                                        "userGroupDescription"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "userGroupDescription",
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
                                                    "userGroupDescription"
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
                                              Number&nbsp;of&nbsp;Users
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
                                                        "numberOfUsers"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "numberOfUsers",
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
                                                    "numberOfUsers"
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
                        </section>
                        <div
                          className="modal modal-adjuster fade"
                          id="viewUserGroupModal"
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
                                    User Groups Management | View
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
                                            User Group ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroupId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User Group Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroupDescription}
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
                          id="deleteUserGroupModal"
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
                                    User Groups Management | Confirm Delete
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="deleteUserGroupModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
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
                                            User Group ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroupId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            User Group Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.userGroupDescription}
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
                                      name="formType"
                                      value="deleteUserGroup"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="userGroupId"
                                      value={modal.userGroupId}
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="batchNo"
                                      value={modal.batchNo}
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
                                        : "Delete User Group"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                  </Form>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Add Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="addUserGroupModal"
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
                                    User Groups Management | Add
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  className="btn-close"
                                   id="addModalClose"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <Form id="addUserGroupForm" method="post">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="adduserGroupDescription"
                                      className="form-label fw-bold"
                                    >
                                      User Group Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="adduserGroupDescription"
                                      name="userGroupDescription"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={modal.userGroupDescription}
                                      onChange={(event) => {
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            userGroupDescription:
                                              validateInputText(
                                                event.target.value
                                              ),
                                          };
                                        });
                                      }}
                                    />
                                    {errors.add.adduserGroupDescriptionError &&
                                      errors.add.adduserGroupDescriptionError
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add
                                              .adduserGroupDescriptionError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="adduserGroupAccessDuration"
                                      className="form-label fw-bold"
                                    >
                                      Access Duration
                                    </label>
                                    <div className="input-group">
                                      <input
                                        type="number"
                                        className="form-control input-group-control input-group-control-mod form-input-mod"
                                        id="adduserGroupAccessDuration"
                                        name="accessDuration"
                                        min="0"
                                        step="1"
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                        value={modal.accessDuration}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              accessDuration:
                                                event.target.value,
                                            };
                                          });
                                        }}
                                      />
                                      <span className="input-group-text input-group-text-mod form-input-mod">
                                        minutes
                                      </span>
                                    </div>
                                    {errors.add.addAccessDurationError &&
                                      errors.add.addAccessDurationError.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.addAccessDurationError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <table className="table table-hover">
                                    <thead>
                                      <tr>
                                        <th>
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Module
                                            </div>
                                          </div>
                                        </th>
                                        <th>
                                          <div className="row table-heading align-items-center table-heading-title">
                                            Privileges Granted
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>{modulePrivilegesChecklist}</tbody>
                                  </table>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="addUserGroup"
                                  />
                                  <input
                                    type="hidden"
                                    name="modulePrivileges"
                                    value={JSON.stringify(modulePrivileges)}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    className="btn btn-theme btn-sm"
                                    form="addUserGroupForm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add New User Group"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Edit Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="editUserGroupModal"
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
                                    User Groups Management | Edit
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="editUseGrouprModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <Form id="editUserGroupForm" method="post">
                                  <div className="mb-3">
                                    <label
                                      htmlFor="edituserGroupDescription"
                                      className="form-label fw-bold"
                                    >
                                      User Group Name
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control form-input-mod"
                                      id="edituserGroupDescription"
                                      name="userGroupDescription"
                                      value={modal.userGroupDescription}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      onChange={(event) => {
                                        setModal((prevModal) => ({
                                          ...prevModal,
                                          userGroupDescription:
                                            validateInputText(
                                              event.target.value
                                            ),
                                          hidden: {
                                            ...prevModal.hidden,
                                          },
                                          static: {
                                            ...prevModal.static,
                                          },
                                        }));
                                      }}
                                    />
                                    {errors.edit
                                      .edituserGroupDescriptionError &&
                                      errors.edit.edituserGroupDescriptionError
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit
                                              .edituserGroupDescriptionError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="mb-3">
                                    <label
                                      htmlFor="edituserGroupAccessDuration"
                                      className="form-label fw-bold"
                                    >
                                      Access Duration
                                    </label>
                                    <div className="input-group">
                                      <input
                                        type="number"
                                        className="form-control input-group-control input-group-control-mod form-input-mod"
                                        id="edituserGroupAccessDuration"
                                        name="accessDuration"
                                        min="0"
                                        step="1"
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                        value={modal.accessDuration}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              accessDuration:
                                                event.target.value,
                                            };
                                          });
                                        }}
                                      />
                                      <span className="input-group-text input-group-text-mod form-input-mod">
                                        minutes
                                      </span>
                                    </div>
                                    {errors.edit.editAccessDurationError &&
                                      errors.edit.editAccessDurationError
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit
                                              .editAccessDurationError[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="editUserGroup"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="userGroupId"
                                    value={modal.userGroupId}
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
                                    form="editUserGroupForm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-pen"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Edit User Group"}
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
