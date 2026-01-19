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
        filteredPrivileges, // Send the filtered privileges array
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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

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
        setIsUpdateOpen(false);
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
        />,
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
                        (privilege) => privilege.privilegeId === privilegeId,
                      )[0];
                      const originalPrivilege = objects.filter(
                        (privilege) => privilege.privilegeId === privilegeId,
                      )[0];
                      if (
                        currentPrivilege.granted !== originalPrivilege.granted
                      ) {
                        const updatePrivilege = updatePrivilegesBatch.filter(
                          (privilege) => privilege.privilegeId === privilegeId,
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
                          (privilege) => privilege.privilegeId === privilegeId,
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
                      allPrivileges,
                    ) {
                      const newUpdatePrivilegesBatch =
                        updatePrivilegesBatch.map((x) => x);
                      allPrivileges.map((privilege) => {
                        const currentPrivilege = currentPrivileges.filter(
                          (cprivilege) =>
                            cprivilege.privilegeId === privilege.privilegeId,
                        )[0];
                        const originalPrivilege = objects.filter(
                          (oprivilege) =>
                            oprivilege.privilegeId === privilege.privilegeId,
                        )[0];
                        if (
                          currentPrivilege.granted !== originalPrivilege.granted
                        ) {
                          const updatePrivilege =
                            newUpdatePrivilegesBatch.filter(
                              (uprivilege) =>
                                uprivilege.privilegeId ===
                                privilege.privilegeId,
                            )[0];
                          if (updatePrivilege == null) {
                            newUpdatePrivilegesBatch.push(currentPrivilege);
                          }
                        } else {
                          const updatePrivilege =
                            newUpdatePrivilegesBatch.filter(
                              (uprivilege) =>
                                uprivilege.privilegeId ===
                                privilege.privilegeId,
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
                                  (filter) => filter.module === module.id,
                                )[0],
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
                        (privilege) => currentFeature?.id === privilege.feature,
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
                              <label className="privilege-switch">
                                <input
                                  type="checkbox"
                                  checked={privilege.granted}
                                  onChange={(event) => {
                                    const newPrivileges = currentPrivileges.map(
                                      (x) => x,
                                    );
                                    const index =
                                      currentPrivileges.indexOf(privilege);
                                    newPrivileges[index].granted =
                                      event.target.checked;

                                    setCurrentPrivileges(() => [
                                      ...newPrivileges,
                                    ]);
                                    updatePrivilegesBatchLoader(
                                      privilege.privilegeId,
                                    );
                                  }}
                                  disabled={!authorities.update}
                                />
                                <span className="privilege-slider"></span>
                              </label>
                            </td>

                            <td>
                              <div className="list-actions">
                                <button
                                  type="button"
                                  className="action-icon view"
                                  title="View"
                                  disabled={!authorities.view}
                                  onClick={() => {
                                    loadModalData(privilege.privilegeId);
                                    setIsViewOpen(true);
                                  }}
                                >
                                  <i className="fa-solid fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });

                    function loadModalData(privilegeId) {
                      setModal(() => {
                        const privilege = objects.filter(
                          (privilege) => privilege.privilegeId === privilegeId,
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
                        (privilege) => currentFeature?.id === privilege.feature,
                      ).length;
                      for (let i = length; i < 5; i++) {
                        dataGrid.push(
                          <tr key={`${i}`}>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>,
                        );
                      }
                      return dataGrid;
                    }

                    const updatePrivilegesModalDataGrid =
                      updatePrivilegesBatch.map((updatePrivilege) => {
                        return (
                          <div
                            key={updatePrivilege.privilegeId}
                            className="app-section"
                          >
                            <div className="app-section__icon icon-blue">
                              <i className="fa-solid fa-shield-check"></i>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p className="app-section__label">
                                {
                                  modules.filter(
                                    (module) =>
                                      module.id === updatePrivilege.module,
                                  )[0].description
                                }{" "}
                                →{" "}
                                {
                                  features.filter(
                                    (feature) =>
                                      feature.id === updatePrivilege.feature,
                                  )[0].description
                                }
                              </p>
                              <p className="app-section__value">
                                {updatePrivilege.privilegedAction}
                              </p>
                            </div>
                            <div
                              className={`app-badge ${updatePrivilege.granted ? "app-badge--success" : "app-badge--danger"}`}
                            >
                              {updatePrivilege.granted ? "Granted" : "Revoked"}
                            </div>
                          </div>
                        );
                      });
                    return (
                      <>
                        <section className="secondary-page">
                          <div className="content">
                            <div className="container">
                              <div className="page-card">
                                <div className="list-header">
                                  <div>
                                    <h2 className="list-title">
                                      User Groups Management | Privileges
                                    </h2>
                                    <p className="list-subtitle">
                                      User Group:{" "}
                                      <span className="fw-bold">
                                        {userGroupDto.userGroupDescription}
                                      </span>{" "}
                                      ({userGroupDto.userGroupId})
                                    </p>
                                  </div>
                                  <Link
                                    to={`../../usergroups${state?.search || ""}`}
                                    className="page-btn"
                                  >
                                    <i className="fa-solid fa-circle-arrow-left"></i>
                                    &nbsp;&nbsp;Back
                                  </Link>
                                </div>

                                {/* Tabs + Update button */}
                                <div className="priv-tabs-wrap">
                                  <div className="priv-tabs">
                                    {modules.map((module) => (
                                      <button
                                        key={module.id}
                                        id={`moduleTab-${module.id}`}
                                        type="button"
                                        className={`priv-tab ${currentModule?.id === module.id ? "active" : ""}`}
                                        onClick={() => {
                                          setCurrentModule(() => module);
                                          setCurrentFeature(
                                            features.filter(
                                              (filter) =>
                                                filter.module === module.id,
                                            )[0],
                                          );
                                          setAllControl({ granted: false });
                                        }}
                                      >
                                        {module.description}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    className="list-add-btn priv-update-btn"
                                    onClick={() => setIsUpdateOpen(true)}
                                    disabled={
                                      !authorities.update ||
                                      updatePrivilegesBatch.length === 0
                                    }
                                  >
                                    <i className="fa-solid fa-rotate-right"></i>
                                    Update Privileges (
                                    {updatePrivilegesBatch.length})
                                  </button>
                                </div>

                                {/* Controls */}
                                <div className="list-controls priv-controls">
                                  <div className="list-search-field">
                                    <label
                                      className="list-label"
                                      htmlFor="features"
                                    >
                                      Feature:
                                    </label>
                                    <select
                                      id="features"
                                      name="features"
                                      className="list-select"
                                      value={currentFeature?.id}
                                      onChange={(event) => {
                                        setCurrentFeature(
                                          () =>
                                            features.filter(
                                              (feature) =>
                                                feature.id ===
                                                event.target.value,
                                            )[0],
                                        );
                                        setAllControl({ granted: false });
                                      }}
                                    >
                                      {featuresDropDown}
                                    </select>
                                  </div>

                                  <div className="list-search-field">
                                    <label
                                      className="list-label"
                                      htmlFor="granted-all"
                                    >
                                      Grant All:
                                    </label>
                                    <label className="privilege-switch">
                                      <input
                                        id="granted-all"
                                        type="checkbox"
                                        checked={allControl.granted}
                                        onChange={(event) => {
                                          const allPrivileges =
                                            currentPrivileges.filter(
                                              (privilege) =>
                                                privilege.feature ===
                                                currentFeature?.id,
                                            );
                                          const newPrivileges =
                                            currentPrivileges.map((x) => x);
                                          allPrivileges?.forEach(
                                            (privilege) => {
                                              const index =
                                                currentPrivileges.indexOf(
                                                  privilege,
                                                );
                                              newPrivileges[index].granted =
                                                event.target.checked;
                                            },
                                          );
                                          setCurrentPrivileges(() => {
                                            return [...newPrivileges];
                                          });
                                          updatePrivilegesBatchLoaderFromArray(
                                            allPrivileges,
                                          );
                                          setAllControl({
                                            granted: event.target.checked,
                                          });
                                        }}
                                      />
                                      <span className="privilege-slider"></span>
                                    </label>
                                  </div>
                                </div>

                                {/* Table */}
                                <div className="list-table-wrap">
                                  <table className="list-table">
                                    <thead>
                                      <tr>
                                        <th>Privilege ID</th>
                                        <th>Privileged Action</th>
                                        <th>Granted</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>{dataGridOffset(dataGrid)}</tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Update Modal with new styling */}
                        {isUpdateOpen && (
                          <div
                            className="app-dialog-overlay"
                            role="dialog"
                            aria-modal="true"
                          >
                            <div
                              className="app-dialog app-dialog--lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="app-dialog__header">
                                <div>
                                  <h2 className="app-dialog__title">
                                    Confirm Privilege Updates
                                  </h2>
                                  <p className="app-dialog__subtitle">
                                    User Group:{" "}
                                    {userGroupDto.userGroupDescription} (
                                    {userGroupDto.userGroupId})
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="app-dialog__close"
                                  aria-label="Close"
                                  onClick={() => setIsUpdateOpen(false)}
                                  disabled={navigation.state === "submitting"}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>

                              <div className="app-dialog__body">
                                <Form
                                  id="updatePrivilegesForm"
                                  method="post"
                                  className="app-form"
                                >
                                  {updatePrivilegesModalDataGrid}

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

                                  <div className="app-actions">
                                    <button
                                      type="button"
                                      className="app-dialog__close-btn"
                                      onClick={() => setIsUpdateOpen(false)}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="submit"
                                      className="app-btn app-btn--primary"
                                      disabled={
                                        navigation.state === "submitting" ||
                                        updatePrivilegesBatch.length === 0
                                      }
                                    >
                                      <i
                                        className="fa-solid fa-rotate-right"
                                        style={{ marginRight: 6 }}
                                      ></i>
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Update Privileges"}
                                    </button>
                                  </div>
                                </Form>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* View Modal */}
                        {isViewOpen && (
                          <div
                            className="app-dialog-overlay"
                            role="dialog"
                            aria-modal="true"
                          >
                            <div
                              className="app-dialog"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="app-dialog__header">
                                <div>
                                  <h4 className="app-dialog__title">
                                    Privileges | View
                                  </h4>
                                  <p className="app-dialog__subtitle">
                                    Review privilege details
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="app-dialog__close"
                                  aria-label="Close"
                                  onClick={() => setIsViewOpen(false)}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                              <div className="app-dialog__body">
                                <div className="app-section">
                                  <div className="app-section__icon icon-blue">
                                    <i className="fa-solid fa-id-badge"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Privilege ID
                                    </p>
                                    <p className="app-section__value">
                                      {modal.privilegeId}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-purple">
                                    <i className="fa-solid fa-layer-group"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">Module</p>
                                    <p className="app-section__value">
                                      {
                                        modules.filter(
                                          (m) => m.id === modal.module,
                                        )[0]?.description
                                      }
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-green">
                                    <i className="fa-solid fa-puzzle-piece"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Feature
                                    </p>
                                    <p className="app-section__value">
                                      {
                                        features.filter(
                                          (f) => f.id === modal.feature,
                                        )[0]?.description
                                      }
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-amber">
                                    <i className="fa-solid fa-shield-check"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Privileged Action
                                    </p>
                                    <p className="app-section__value">
                                      {modal.privilegedAction}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-blue">
                                    <i className="fa-solid fa-toggle-on"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Granted
                                    </p>
                                    <p className="app-section__value">
                                      {modal.granted ? "Yes" : "No"}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-purple">
                                    <i className="fa-solid fa-clock"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Created
                                    </p>
                                    <p className="app-section__value">
                                      {modal.created}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-green">
                                    <i className="fa-solid fa-user"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Created By
                                    </p>
                                    <p className="app-section__value app-section__value--break">
                                      {modal.createdBy}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-amber">
                                    <i className="fa-solid fa-pen"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Last Modified
                                    </p>
                                    <p className="app-section__value">
                                      {modal.lastModified}
                                    </p>
                                  </div>
                                </div>

                                <div className="app-section">
                                  <div className="app-section__icon icon-blue">
                                    <i className="fa-solid fa-user-gear"></i>
                                  </div>
                                  <div>
                                    <p className="app-section__label">
                                      Last Modified By
                                    </p>
                                    <p className="app-section__value app-section__value--break">
                                      {modal.lastModifiedBy}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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
