import React, { Suspense, useEffect, useState } from "react";
import {
  useLoaderData,
  Form,
  useLocation,
  Link,
  redirect,
  Await,
  defer,
  useNavigation,
  useActionData,
} from "react-router-dom";
import { requireAuth } from "../../api/administration/authenticationApi";
import {
  searchPrivileges,
  updatePrivileges,
} from "../../api/administration/userGroupsApi";
import ContentThrobber from "../../components/throbbers/ContentThrobber";
import SessionTimoutError from "../../components/SessionTimeoutError";
import ServerMessageToast from "../../components/ServerMessageToast";

export async function loader({ params }) {
  const authentication = requireAuth();
  const privilegesDataAPI = await searchPrivileges(params.userGroupId);
  return defer({ authentication, privilegesDataAPI });
}

export async function action({ request }) {
  const formData = await request.formData();

  if (formData.get("formType") === "updatePrivileges") {
    const userGroupId = formData.get("userGroupId");
    const batchNo = formData.get("batchNo");
    const privileges = JSON.parse(formData.get("privileges"));
    console.log(privileges);

    if (
      !userGroupId ||
      !batchNo ||
      !Array.isArray(privileges) ||
      privileges.length <= 0
    ) {
      return null;
    } else {
      // Filter privileges array to only include privilegeId and granted
      const filteredPrivileges = privileges.map((privilege) => ({
        privilegeId: privilege.privilegeId,
        granted: privilege.granted,
      }));

      console.log(filteredPrivileges);

      let updatePrivilegesResponse = await updatePrivileges(
        userGroupId,
        batchNo,
        filteredPrivileges // Send the filtered privileges array
      );

      if (updatePrivilegesResponse !== null) {
        updatePrivilegesResponse = {
          ...updatePrivilegesResponse,
          formType: "updatePrivileges",
        };
        return updatePrivilegesResponse;
      }
    }
  }

  return null;
}

export default function Privileges() {
  const { authentication, privilegesDataAPI } = useLoaderData();
  const { state } = useLocation();
  const [updatePrivilegesBatch, setUpdatePrivilegesBatch] = useState([]);
  const [modal, setModal] = useState({
    privilegeId: "UNAUTHORIZED",
    feature: "UNAUTHORIZED",
    module: "UNAUTHORIZED",
    privilegedAction: "UNAUTHORIZED",
    granted: "UNAUTHORIZED",
    created: "UNAUTHORIZED",
    createdBy: "UNAUTHORIZED",
    lastModified: "UNAUTHORIZED",
    lastModifiedBy: "UNAUTHORIZED",
  });
  const response = useActionData();
  const navigation = useNavigation();
  const [currentModule, setCurrentModule] = useState();
  const [currentFeature, setCurrentFeature] = useState();
  const [currentPrivileges, setCurrentPrivileges] = useState([]);

  function stringifyUpdatePrivilegesBatch() {
    return JSON.stringify(updatePrivilegesBatch);
  }
  const [toasts, setToasts] = useState([]);
  const [allControl, setAllControl] = useState({
    granted: false,
  });
  useEffect(() => {
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (
        response.formType === "updatePrivileges" &&
        response.message.success
      ) {
        document.getElementById("updatePrivilegesModalClose").click();
        setTimeout(function () {
          setUpdatePrivilegesBatch(() => {
            return [];
          });
          setAllControl(() => {
            return {
              granted: false,
            };
          });
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
                <Await resolve={privilegesDataAPI}>
                  {({ data }) => {
                    const {
                      authorities,
                      objects,
                      userGroupDto,
                      modules,
                      features,
                    } = data;
                    useEffect(() => {
                      const privilegeArray = objects.map((x) => {
                        return {
                          ...x,
                        };
                      });
                      setCurrentPrivileges(() => {
                        return privilegeArray;
                      });
                    }, [objects]);

                    useEffect(() => {
                      setCurrentModule(() => {
                        return modules[0];
                      });
                    }, [modules]);

                    useEffect(() => {
                      setCurrentFeature(() => {
                        return features[0];
                      });
                    }, [features]);

                    function updatePrivilegesBatchLoader(privilegeId) {
                      const currentPrivilege = currentPrivileges.filter(
                        (privilege) => privilege.privilegeId === privilegeId
                      )[0];
                      const originalPrivilege = objects.filter(
                        (privilege) => privilege.privilegeId === privilegeId
                      )[0];
                      if (
                        currentPrivilege.granted !== originalPrivilege.granted
                      ) {
                        const updatePrivilege = updatePrivilegesBatch.filter(
                          (privilege) => privilege.privilegeId === privilegeId
                        )[0];
                        if (updatePrivilege == null) {
                          const newUpdatePrivilegesBatch =
                            updatePrivilegesBatch.map((x) => x);
                          newUpdatePrivilegesBatch.push(currentPrivilege);
                          setUpdatePrivilegesBatch(() => {
                            return [...newUpdatePrivilegesBatch];
                          });
                        }
                      } else {
                        const updatePrivilege = updatePrivilegesBatch.filter(
                          (privilege) => privilege.privilegeId === privilegeId
                        )[0];
                        if (updatePrivilege != null) {
                          const index =
                            updatePrivilegesBatch.indexOf(updatePrivilege);
                          const newUpdatePrivilegesBatch =
                            updatePrivilegesBatch.map((x) => x);
                          newUpdatePrivilegesBatch.splice(index, 1);
                          setUpdatePrivilegesBatch(() => {
                            return [...newUpdatePrivilegesBatch];
                          });
                        }
                      }
                    }

                    function updatePrivilegesBatchLoaderFromArray(
                      allPrivileges
                    ) {
                      const newUpdatePrivilegesBatch =
                        updatePrivilegesBatch.map((x) => x);
                      allPrivileges.map((privilege) => {
                        const currentPrivilege = currentPrivileges.filter(
                          (cprivilege) =>
                            cprivilege.privilegeId === privilege.privilegeId
                        )[0];
                        const originalPrivilege = objects.filter(
                          (oprivilege) =>
                            oprivilege.privilegeId === privilege.privilegeId
                        )[0];
                        if (
                          currentPrivilege.granted !== originalPrivilege.granted
                        ) {
                          const updatePrivilege =
                            newUpdatePrivilegesBatch.filter(
                              (uprivilege) =>
                                uprivilege.privilegeId === privilege.privilegeId
                            )[0];
                          if (updatePrivilege == null) {
                            newUpdatePrivilegesBatch.push(currentPrivilege);
                          }
                        } else {
                          const updatePrivilege =
                            newUpdatePrivilegesBatch.filter(
                              (uprivilege) =>
                                uprivilege.privilegeId === privilege.privilegeId
                            )[0];
                          if (updatePrivilege != null) {
                            const index =
                              newUpdatePrivilegesBatch.indexOf(updatePrivilege);
                            newUpdatePrivilegesBatch.splice(index, 1);
                          }
                        }
                      });
                      setUpdatePrivilegesBatch(() => {
                        return [...newUpdatePrivilegesBatch];
                      });
                    }

                    const moduleTabs = modules.map((module) => {
                      return (
                        <li className="nav-item folder-item" key={module.id}>
                          <button
                            id={`moduleTab-${module.id}`}
                            type="button"
                            className={`nav-link ${
                              currentModule?.id === module.id
                                ? "active folder-link-active"
                                : "folder-link"
                            } top-nav-link`}
                            onClick={() => {
                              setCurrentModule(() => module);
                              setCurrentFeature(
                                features.filter(
                                  (filter) => filter.module === module.id
                                )[0]
                              );
                              setAllControl(() => {
                                return {
                                  granted: false,
                                };
                              });
                            }}
                          >
                            {module.description}
                          </button>
                        </li>
                      );
                    });

                    const featuresDropDown = features
                      .filter((feature) => feature.module === currentModule?.id)
                      .map((feature) => {
                        return (
                          <option key={feature.id} value={feature.id}>
                            {feature.description}
                          </option>
                        );
                      });

                    const dataGrid = currentPrivileges
                      .filter(
                        (privilege) => currentFeature?.id === privilege.feature
                      )
                      .map((privilege) => {
                        return (
                          <tr key={privilege.privilegeId}>
                            <td className="text-truncate align-middle">
                              {privilege.privilegeId}
                            </td>
                            <td className="text-truncate align-middle">
                              {privilege.privilegedAction}
                            </td>
                            <td className="text-truncate align-middle">
                              <div className="form-check form-switch">
                                <input
                                  id={`granted-${privilege.privilegeId}`}
                                  className="form-check-input form-switch-mod privilege-switch"
                                  type="checkbox"
                                  role="switch"
                                  checked={privilege.granted}
                                  onChange={(event) => {
                                    const newPrivileges = currentPrivileges.map(
                                      (x) => x
                                    );
                                    const index =
                                      currentPrivileges.indexOf(privilege);
                                    newPrivileges[index].granted =
                                      event.target.checked;

                                    setCurrentPrivileges(() => [
                                      ...newPrivileges,
                                    ]);
                                    updatePrivilegesBatchLoader(
                                      privilege.privilegeId
                                    );
                                  }}
                                  disabled={!authorities.update}
                                />
                              </div>
                            </td>

                            <td className="align-middle">
                              <div className="row">
                                <div className="col col-2">
                                  <button
                                    type="button"
                                    className="action-btn"
                                    title="View"
                                    data-bs-toggle="modal"
                                    data-bs-target="#viewPrivilegesModal"
                                    disabled={!authorities.view}
                                    onClick={() => {
                                      loadModalData(privilege.privilegeId);
                                    }}
                                  >
                                    <i className="fa-sharp fa-solid fa-eye"></i>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });

                    function loadModalData(privilegeId) {
                      setModal(() => {
                        const privilege = objects.filter(
                          (privilege) => privilege.privilegeId === privilegeId
                        );
                        return {
                          ...privilege[0],
                          hidden: {
                            ...privilege[0].hidden,
                          },
                        };
                      });
                    }

                    function dataGridOffset(dataGrid) {
                      const length = objects.filter(
                        (privilege) => currentFeature?.id === privilege.feature
                      ).length;
                      for (let i = length; i < 5; i++) {
                        dataGrid.push(
                          <tr key={`${i}`}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                         
                          </tr>
                        );
                      }
                      return dataGrid;
                    }

                    const updatePrivilegesModalDataGrid =
                      updatePrivilegesBatch.map((updatePrivilege) => {
                        return (
                          <tr key={updatePrivilege.privilegeId}>
                            <td className="text-truncate align-middle">
                              {
                                modules.filter(
                                  (module) =>
                                    module.id === updatePrivilege.module
                                )[0].description
                              }
                            </td>
                            <td className="text-truncate align-middle">
                              {
                                features.filter(
                                  (feature) =>
                                    feature.id === updatePrivilege.feature
                                )[0].description
                              }
                            </td>
                            <td className="text-truncate align-middle">
                              {updatePrivilege.privilegedAction}
                            </td>
                            <td className="text-truncate align-middle">
                              {updatePrivilege.granted ? "Yes" : "No"}
                            </td>
                          </tr>
                        );
                      });
                    return (
                      <>
                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 align-items-center user-content">
                                <div className="col">
                                  <h4 className="page-header user-heading">
                                    User Groups Management | Privileges
                                  </h4>
                                  <div className="mt-2 callback-text usergroup-info">
                                    <h5 className="usergroup-info-text">
                                      <span className="fw-bold">
                                        User Group:{" "}
                                      </span>
                                      {userGroupDto.userGroupDescription} (
                                      {userGroupDto.userGroupId})
                                    </h5>
                                  </div>
                                </div>
                              </div>
                              <div className="row table-row mb-3">
                                <div className="col col-1 d-flex p-0">
                                  <Link
                                    to={`../../usergroups${
                                      state?.search || ""
                                    }`}
                                    className="btn btn-theme-outline btn-sm text-nowrap"
                                  >
                                    &nbsp;&nbsp;
                                    <i className="fa-solid fa-circle-arrow-left"></i>
                                    &nbsp;&nbsp;&nbsp;Back&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                  </Link>
                                </div>
                              </div>
                              <div className="row table-row mb-3">
                                <div className="col table-responsive bg-theme-1 border rounded table-container">
                                  <ul className="nav nav-tabs folder rounded-top">
                                    {moduleTabs}
                                    <div className="col text-end add-btn pe-2">
                                      <button
                                        type="button"
                                        className="btn btn-theme btn-sm"
                                        data-bs-toggle="modal"
                                        data-bs-target="#updatePrivilegesModal"
                                        disabled={
                                          authorities.update
                                            ? updatePrivilegesBatch.length === 0
                                            : true
                                        }
                                      >
                                        &nbsp;
                                        <i className="fa-sharp fa-solid fa-circle-arrow-up"></i>
                                        &nbsp;&nbsp;Update&nbsp;Privileges&nbsp;(
                                        {updatePrivilegesBatch.length}
                                        )&nbsp;&nbsp;
                                      </button>
                                    </div>
                                  </ul>
                                  <div className="row px-3 pt-3 folder-settings align-items-center">
                                    <div className="col col-2 search-by-col-2 d-flex align-items-center">
                                      <label className="fw-bold">
                                        Feature:&nbsp;&nbsp;
                                      </label>
                                      <select
                                        name="features"
                                        className="form-select form-select-sm form-select-mod"
                                        value={currentFeature?.id}
                                        onChange={(event) => {
                                          setCurrentFeature(
                                            () =>
                                              features.filter(
                                                (feature) =>
                                                  feature.id ===
                                                  event.target.value
                                              )[0]
                                          );
                                          setAllControl(() => {
                                            return {
                                              granted: false,
                                            };
                                          });
                                        }}
                                      >
                                        {featuresDropDown}
                                      </select>
                                    </div>
                                    <div className="col">
                                      <div className="row justify-content-end align-items-center">
                                        <div className="col col-1 search-by-col-1 d-flex">
                                          <label className="fw-bold">
                                            Grant All:&nbsp;&nbsp;
                                          </label>
                                          <div className="col col-1 search-by-col-1 d-flex">
                                            <label className="fw-bold">
                                              Grant All:&nbsp;&nbsp;
                                            </label>
                                            <div className="form-check form-switch">
                                              <input
                                                id="granted-all"
                                                className="form-check-input form-switch-mod yellow-switch"
                                                type="checkbox"
                                                role="switch"
                                                checked={allControl.granted}
                                                onChange={(event) => {
                                                  const allPrivileges =
                                                    currentPrivileges.filter(
                                                      (privilege) =>
                                                        privilege.feature ===
                                                        currentFeature?.id
                                                    );
                                                  const newPrivileges =
                                                    currentPrivileges.map(
                                                      (x) => x
                                                    );
                                                  allPrivileges?.map(
                                                    (privilege) => {
                                                      const index =
                                                        currentPrivileges.indexOf(
                                                          privilege
                                                        );
                                                      newPrivileges[
                                                        index
                                                      ].granted =
                                                        event.target.checked;
                                                    }
                                                  );
                                                  setCurrentPrivileges(() => {
                                                    return [...newPrivileges];
                                                  });
                                                  updatePrivilegesBatchLoaderFromArray(
                                                    allPrivileges
                                                  );
                                                  setAllControl({
                                                    granted:
                                                      event.target.checked,
                                                  });
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="folder-content">
                                    <table className="table table-hover">
                                      <thead>
                                        <tr>
                                          <th>
                                            <div className="row table-heading align-items-center">
                                              <div className="col table-heading-title">
                                                Privilege&nbsp;ID
                                              </div>
                                            </div>
                                          </th>
                                          <th>
                                            <div className="row table-heading align-items-center">
                                              <div className="col table-heading-title">
                                                Privileged&nbsp;Action
                                              </div>
                                            </div>
                                          </th>
                                          <th>
                                            <div className="row table-heading align-items-center">
                                              Granted
                                            </div>
                                          </th>
                                          <th>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>{dataGridOffset(dataGrid)}</tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                        <div
                          className="modal modal-adjuster fade"
                          id="updatePrivilegesModal"
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
                                    Privileges | Confirm Update
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <h5>
                                      <span className="fw-bold">
                                        User Group ID:{" "}
                                      </span>
                                      {userGroupDto.userGroupId}
                                    </h5>
                                    <h5>
                                      <span className="fw-bold">
                                        User Group Name:{" "}
                                      </span>
                                      {userGroupDto.userGroupDescription}
                                    </h5>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  id="updatePrivilegesModalClose"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
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
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Feature
                                          </div>
                                        </div>
                                      </th>
                                      <th>
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Privileged&nbsp;Action
                                          </div>
                                        </div>
                                      </th>
                                      <th className="granted-text">Granted</th>
                                    </tr>
                                  </thead>
                                  <tbody>{updatePrivilegesModalDataGrid}</tbody>
                                </table>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <Form method="post">
                                    <button
                                      type="submit"
                                      className="btn btn-theme btn-sm"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    >
                                      &nbsp;
                                      <i className="fa-sharp fa-solid fa-circle-arrow-up"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Update Privileges"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="userGroupId"
                                      value={userGroupDto.userGroupId}
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="batchNo"
                                      value={userGroupDto.batchNo}
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="updatePrivileges"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="privileges"
                                      value={stringifyUpdatePrivilegesBatch()}
                                      readOnly={true}
                                    />
                                  </Form>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="modal modal-adjuster fade"
                          id="viewPrivilegesModal"
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
                                    Privileges | View
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
                                            Privilege ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.privilegeId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Module
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {
                                          modules.filter(
                                            (module) =>
                                              module.id === modal.module
                                          )[0]?.description
                                        }
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Feature
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {
                                          features.filter(
                                            (feature) =>
                                              feature.id === modal.feature
                                          )[0]?.description
                                        }
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Privileged Action
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.privilegedAction}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Granted
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.granted ? "Yes" : "No"}
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
