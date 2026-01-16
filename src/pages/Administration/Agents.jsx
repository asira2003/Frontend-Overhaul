import React, { Suspense, useEffect, useRef, useState } from "react";
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
import ServerMessageToast from "../../components/ServerMessageToast";
import {
  searchAgents,
  addAgent,
  editAgent,
  deleteAgent,
  agentsLoadBusinessRegistrationFile,
} from "../../api/administration/agents";
import {
  validatePhoneNumber,
  validatePhoneNumberWithCode,
  validateInputTextNoUpperCase,
  getAllCountryCodes,
  validateInputText,
} from "../../utils/StringUtils";
import Dropzone, { useDropzone } from "react-dropzone";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "agentId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const filterValue = url.searchParams.get("filterValue") || "all";
  const agentsDataAPI = await searchAgents(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const agentData = { authentication, agentsDataAPI };
  return defer(agentData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");

  if (formType === "addAgent") {
    const agentName = formData.get("agentName");
    const agentEmail = formData.get("agentEmail");
    const countryCode = formData.get("countryCode");
    let agentPhone = formData.get("agentPhone");
    const agentAddress = formData.get("agentAddress");
    let active = true;
    const agentBusinessRegistrationNo = formData.get(
      "agentBusinessRegistrationNo"
    );
    const agentBusinessRegistrationFile = formData.get(
      "agentBusinessRegistrationFile"
    );
    let newsLetter = formData.get("newsLetter");
    const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let response = { errors: [] };
    if (!agentName || agentName === "" || !inputRegex.test(agentName)) {
      response.errors.push({
        name: "addAgentName",
        message:
          "Please enter a valid Agent name using only letters, numbers, and spaces.",
      });
    }

    if (
      agentEmail === null ||
      agentEmail === "" ||
      !emailRegex.test(agentEmail)
    ) {
      response.errors.push({
        name: "addAgentEmail",
        message: "Please enter a valid Agent Email.",
      });
    }
    if (
      agentPhone === null ||
      agentPhone === "" ||
      agentPhone.length < 9 ||
      agentPhone.length > 14
    ) {
      response.errors.push({
        name: "addAgentPhone",
        message: "Please enter a valid Agent phone number.",
      });
    }

    if (
      agentAddress === null ||
      agentAddress === "" ||
      !inputRegex.test(agentAddress)
    ) {
      response.errors.push({
        name: "addAgentAddress",
        message: "Please enter a valid Agent Address.",
      });
    }

    if (
      agentBusinessRegistrationNo === null ||
      agentBusinessRegistrationNo === "" ||
      !inputRegex.test(agentBusinessRegistrationNo)
    ) {
      response.errors.push({
        name: "addBusinessRegistrationNo",
        message: "Please enter a valid Business Registration Number.",
      });
    }

    if (
      !agentBusinessRegistrationFile ||
      agentBusinessRegistrationFile.size === 0
    ) {
      response.errors.push({
        name: "addBusinessRegistrationFile",
        message: "Please upload a valid Business Registration File.",
      });
    }

    agentPhone = `${countryCode || ""}${agentPhone || ""}`.trim();

    newsLetter = newsLetter === "on" ? true : false;

    if (response.errors.length !== 0) {
      response = { ...response, formType: "addAgent" };
      return response;
    }

    const agentDto = {
      agentEmail,
      agentName,
      agentPhone,
      agentAddress,
      agentBusinessRegistrationNo,
      newsLetter,
      active,
    };

    console.log(agentBusinessRegistrationFile);

    let addAgentResponse = await addAgent(
      agentDto,
      agentBusinessRegistrationFile
    );

    if (addAgentResponse !== null) {
      addAgentResponse = {
        ...addAgentResponse,
        formType: formType,
      };
      return addAgentResponse;
    }
  }

  if (formType === "editAgent") {
    const agentId = formData.get("agentId");
    const batchNo = formData.get("batchNo");
    const agentName = formData.get("agentName");
    const agentEmail = formData.get("agentEmail");
    const countryCode = formData.get("countryCode");
    let agentPhone = formData.get("agentPhone");
    const agentAddress = formData.get("agentAddress");
    let active = formData.get("active");
    const agentBusinessRegistrationNo = formData.get(
      "agentBusinessRegistrationNo"
    );
    const agentBusinessRegistrationFile = formData.get(
      "agentBusinessRegistrationFile"
    );
    let newsLetter = formData.get("newsLetter");
    const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let response = { errors: [] };

    if (agentName === null || agentName === "" || !inputRegex.test(agentName)) {
      response.errors.push({
        name: "editAgentName",
        message: "Please enter a valid Agent name.",
      });
    }
    if (
      agentEmail === null ||
      agentEmail === "" ||
      !emailRegex.test(agentEmail)
    ) {
      response.errors.push({
        name: "editAgentEmail",
        message: "Please enter a valid Agent Email.",
      });
    }
    if (isNaN(agentPhone) || agentPhone === null || agentPhone === "") {
      response.errors.push({
        name: "editAgentPhone",
        message: "Please enter a valid Customer Agent Number.",
      });
    }
    if (
      agentAddress === null ||
      agentAddress === "" ||
      !inputRegex.test(agentAddress)
    ) {
      response.errors.push({
        name: "editAgentAddress",
        message: "Please enter a valid Agent Address.",
      });
    }
    if (
      agentBusinessRegistrationNo === null ||
      agentBusinessRegistrationNo === "" ||
      !inputRegex.test(agentBusinessRegistrationNo)
    ) {
      response.errors.push({
        name: "editBusinessRegistrationNo",
        message: "Please enter a valid Business Registration Number.",
      });
    }

    newsLetter = newsLetter === "on" ? true : false;

    if (active === null || active === "") {
      active = false;
    } else {
      active = true;
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: formType };
      return response;
    }

    const agentDto = {
      agentEmail,
      agentName,
      agentPhone,
      agentAddress,
      agentBusinessRegistrationNo,
      newsLetter,
      active,
      agentId,
      batchNo,
    };

    let editAgentResponse = await editAgent(
      agentDto,
      agentBusinessRegistrationFile
    );

    if (editAgentResponse !== null) {
      editAgentResponse = {
        ...editAgentResponse,
        formType: formType,
      };
      return editAgentResponse;
    }
  }

  if (formType === "deleteAgent") {
    const agentId = formData.get("agentId");
    const batchNo = formData.get("batchNo");
    if (agentId === null || agentId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let deleteAgentResponse = await deleteAgent(agentId, batchNo);
    if (deleteAgentResponse !== null) {
      deleteAgentResponse = {
        ...deleteAgentResponse,
        formType: formType,
      };
      return deleteAgentResponse;
    }
  }

  return null;
}

export default function Agents() {
  const { agentsDataAPI, authentication } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const hiddenInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const searchFormSubmitRef = useRef(null);
  const [searchForm, setSearchForm] = useState({
    searchBy: searchParams.get("searchBy") || "agentId",
    searchValue: searchParams.get("searchValue") || "",
    sortType: searchParams.get("sortType") || "created",
    sortOrder: searchParams.get("sortOrder") || "desc",
    filterValue: searchParams.get("filterValue") || "all",
  });
  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "agentId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
        filterValue: searchParams.get("filterValue") || "all",
      };
    });
  }, [searchParams]);
  const [errors, setErrors] = useState({
    add: {
      agentName: null,
      agentPhone: null,
      agentEmail: null,
      agentAddress: null,
      agentBusinessRegistrationNo: null,
      agentBusinessRegistrationFile: null,
    },
    edit: {
      agentName: null,
      agentPhone: null,
      agentEmail: null,
      agentAddress: null,
      agentBusinessRegistrationNo: null,
    },
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
      post: false,
      payments: false,
      print: false,
      checkout: false,
      cancel: false,
      directDeposit: false,
    },
    batchNo: "",
    created: "",
    createdBy: "",
    lastModified: "",
    lastModifiedBy: "",
    agentId: "",
    agentEmail: "",
    agentName: "",
    agentPhone: "",
    agentAddress: "",
    agentBusinessRegistrationNo: "",
    agentBusinessRegistrationFile: "",
    newsLetter: true,
    countryCode: "+49",
    active: false,
    static: {
      agentName: "",
    },
    fileUrl: null,
    fileType: null,
    loadingFile: false,
  });
  const response = useActionData();

  const navigation = useNavigation();
  const [toasts, setToasts] = useState([]);
  const [phoneWarning, setPhoneWarning] = useState(null);

  function clearModalData() {
    // Revoke blob URL to free memory
    if (modal.fileUrl) {
      URL.revokeObjectURL(modal.fileUrl);
    }

    // ✅ Clear the file input manually
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = null;
    }

    setModal(() => ({
      authorities: {
        add: false,
        edit: false,
        delete: false,
        view: false,
        privileges: false,
        update: false,
        resetPassword: false,
        post: false,
        payments: false,
        print: false,
        checkout: false,
        cancel: false,
        directDeposit: false,
      },
      batchNo: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      agentId: "",
      agentEmail: "",
      agentName: "",
      agentPhone: "",
      agentAddress: "",
      agentBusinessRegistrationNo: "",
      agentBusinessRegistrationFile: "",
      newsLetter: true,
      countryCode: "+49",
      active: false,
      static: {
        agentName: "",
      },
      fileUrl: null,
      fileType: null,
      loadingFile: false,
    }));

    // ✅ Optional: also clear uploadedFiles state if used
    setUploadedFiles([]);
  }

  useEffect(() => {
    setErrors(() => {
      return {
        add: {
          agentName: response?.errors?.filter((o) => o.name === "addAgentName"),
          agentEmail: response?.errors?.filter(
            (o) => o.name === "addAgentEmail"
          ),
          agentPhone: response?.errors?.filter(
            (o) => o.name === "addAgentPhone"
          ),
          agentAddress: response?.errors?.filter(
            (o) => o.name === "addAgentAddress"
          ),
          agentBusinessRegistrationNo: response?.errors?.filter(
            (o) => o.name === "addBusinessRegistrationNo"
          ),
          agentBusinessRegistrationFile: response?.errors?.filter(
            (o) => o.name === "addBusinessRegistrationFile"
          ),
        },
        edit: {
          agentName: response?.errors?.filter(
            (o) => o.name === "editAgentName"
          ),
          agentEmail: response?.errors?.filter(
            (o) => o.name === "editAgentEmail"
          ),
          agentPhone: response?.errors?.filter(
            (o) => o.name === "editAgentPhone"
          ),
          agentAddress: response?.errors?.filter(
            (o) => o.name === "editAgentAddress"
          ),
          agentBusinessRegistrationNo: response?.errors?.filter(
            (o) => o.name === "editBusinessRegistrationNo"
          ),
        },
      };
    });
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (response.formType === "addAgent" && response.message.success) {
        document.getElementById("addModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "deleteAgent" && response.message.success) {
        document.getElementById("deleteModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "editAgent" && response.message.success) {
        document.getElementById("editModalClose").click();
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

  useEffect(() => {
    const combinedPhone = `${modal.countryCode}${modal.agentPhone}`;

    const isDuplicate = agentsDataAPI.data.objects.some(
      (agent) => agent.agentPhone === combinedPhone
    );

    setPhoneWarning(
      isDuplicate ? "This phone number is already in use." : null
    );
  }, [modal.countryCode, modal.agentPhone]);

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
                <Await resolve={agentsDataAPI}>
                  {({ data }) => {
                    const { authorities, pagination, objects } = data;
                    const dataGrid = objects.map((agent) => {
                      return (
                        <tr key={agent.agentId}>
                          <td className="text-truncate">{agent.agentId}</td>
                          <td className="text-truncate">{agent.agentName}</td>
                          <td className="text-truncate">{agent.agentEmail}</td>
                          <td className="text-truncate">{agent.agentPhone}</td>
                          <td className="text-truncate">
                            {agent.active ? (
                              <span className="disc-active fw-bold">
                                Active
                              </span>
                            ) : (
                              <span className="disc-pending fw-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="row">
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="View"
                                  data-bs-toggle="modal"
                                  data-bs-target="#viewAgentModal"
                                  disabled={!agent.authorities.view}
                                  value={agent.agentId}
                                  onClick={() => loadModalData(agent.agentId)}
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
                                  data-bs-target="#editAgentModal"
                                  disabled={!agent.authorities.edit}
                                  value={agent.agentId}
                                  onClick={() => loadModalData(agent.agentId)}
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
                                  data-bs-target="#deleteAgentModal"
                                  disabled={!agent.authorities.delete}
                                  value={agent.agentId}
                                  onClick={() => loadModalData(agent.agentId)}
                                >
                                  <i className="fa-sharp fa-solid fa-trash"></i>
                                </button>
                              </div>
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
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>
                        );
                      }
                      return dataGrid;
                    }

                    function loadModalData(agentId) {
                      const agent = objects.filter(
                        (agent) => agent.agentId === agentId
                      )[0];
                      setModal(() => {
                        return {
                          batchNo: agent.batchNo,
                          created: agent.created,
                          createdBy: agent.createdBy,
                          lastModified: agent.lastModified,
                          lastModifiedBy: agent.lastModifiedBy,
                          agentId: agent.agentId,
                          agentEmail: agent.agentEmail,
                          agentName: agent.agentName,
                          agentPhone: agent.agentPhone,
                          agentAddress: agent.agentAddress,
                          agentBusinessRegistrationNo:
                            agent.agentBusinessRegistrationNo,
                          agentBusinessRegistrationFile:
                            agent.agentBusinessRegistrationFile,
                          countryCode: "+49",
                          active: agent.active,
                          newsLetter: agent.newsLetter,
                          static: {
                            agentName: agent.agentName,
                          },
                        };
                      });
                      setErrors(() => {
                        return {
                          add: {
                            agentName: null,
                            agentPhone: null,
                            agentEmail: null,
                            agentAddress: null,
                            agentBusinessRegistrationNo: null,
                            agentBusinessRegistrationFile: null,
                          },
                          edit: {
                            agentName: null,
                            agentPhone: null,
                            agentEmail: null,
                            agentAddress: null,
                            agentBusinessRegistrationNo: null,
                          },
                        };
                      });
                      loadBusinessRegistrationFile(agentId);
                    }
                    async function loadBusinessRegistrationFile(agentId) {
                      try {
                        // Set loading state first
                        setModal((prev) => ({ ...prev, loadingFile: true }));

                        const result = await agentsLoadBusinessRegistrationFile(
                          agentId
                        );
                        if (!result) {
                          setModal((prev) => ({
                            ...prev,
                            loadingFile: false,
                            fileUrl: null,
                            fileType: null,
                          }));
                          return;
                        }

                        const { fileUrl, contentType } = result;
                        console.log("Detected content type:", contentType);

                        // Update modal state with file info
                        setModal((prev) => ({
                          ...prev,
                          fileUrl,
                          fileType: contentType,
                          loadingFile: false,
                        }));
                      } catch (error) {
                        console.error(
                          "Error loading registration file:",
                          error
                        );
                        setModal((prev) => ({
                          ...prev,
                          loadingFile: false,
                          fileUrl: null,
                          fileType: null,
                        }));
                      }
                    }

                    return (
                      <>
                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 mb-3 align-items-center user-content">
                                <div className="col title-grn">
                                  <h4 className="page-header user-heading">
                                    Agents Management
                                  </h4>
                                </div>
                                <div className="col text-end add-btn">
                                  <button
                                    className="btn btn-theme btn-sm"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addAgentModal"
                                    disabled={!authorities.add}
                                    onClick={clearModalData}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;Agent&nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                              <div className="row justify-content-end mb-3">
                                <div className="col table-row">
                                  <div className="row align-items-center">
                                    <div className="col-xxl-5 col-10">
                                      <select
                                        form="searchForm"
                                        id="fiterValue"
                                        name="filterValue"
                                        className="form-select form-select-sm form-select-mod"
                                        value={searchForm.filterValue}
                                        onChange={(event) => {
                                          setSearchForm((prevSearchForm) => {
                                            return {
                                              ...prevSearchForm,
                                              filterValue: event.target.value,
                                            };
                                          });
                                          setTimeout(function () {
                                            searchFormSubmitRef.current.click();
                                          }, 0);
                                        }}
                                      >
                                        <option value="all">ALL</option>
                                        <option value="true">ACTIVE</option>
                                        <option value="false">INACTIVE</option>
                                      </select>
                                      <button
                                        className="invisible-btn"
                                        ref={searchFormSubmitRef}
                                        type="submit"
                                        form="searchForm"
                                      >
                                        Hidden
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="col col-xxl-3">
                                  <div className="row align-items-center">
                                    <div className="col search-by-col-1 text-end">
                                      <label className="fw-bold">
                                        Search by:{" "}
                                      </label>
                                    </div>
                                    <div className="col col-sm-4 search-by-col-2">
                                      <select
                                        form="searchForm"
                                        id="searchBy"
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
                                        <option value="agentId">
                                          Agent&nbsp;ID
                                        </option>
                                        <option value="agentName">
                                          Agent&nbsp;Name
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
                                        id="searchValue"
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
                                              Agent&nbsp;ID
                                            </div>
                                            <div className="col col-1 sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "agentId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "agentId",
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
                                                    "agentId"
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
                                              Agent&nbsp;Name
                                            </div>
                                            <div className="col col-1 sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "agentName"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "agentName",
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
                                                    "agentName"
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
                                              Agent&nbsp;Email
                                            </div>
                                            <div className="col col-1 sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "agentEmail"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "agentEmail",
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
                                                    "agentEmail"
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
                                              Agent&nbsp;Phone&nbsp;Number
                                            </div>
                                            <div className="col col-1 sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "agentPhone"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "agentPhone",
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
                                                    "agentPhone"
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
                                              Status
                                            </div>
                                            <div className="col col-1 sort-caret">
                                              <button
                                                type="submit"
                                                form="searchForm"
                                                onClick={() => {
                                                  setSearchForm(
                                                    (prevSearchForm) => {
                                                      const sortOrder =
                                                        prevSearchForm.sortType ===
                                                        "active"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "active",
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
                                                    "active"
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
                                          className="page-link"
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

                        {/* View Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="viewAgentModal"
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
                                    Agents Management | View
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Agent ID: </span>
                                    {modal.agentId}
                                    <br />
                                    <span className="fw-bold">
                                      Agent Name:{" "}
                                    </span>
                                    {modal.agentName}
                                  </div>
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
                                            Agent ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentEmail}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Phone Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentPhone}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Address
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentAddress}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Business Registration Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentBusinessRegistrationNo}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {modal.active ? (
                                          <span className="disc-active fw-bold">
                                            Active
                                          </span>
                                        ) : (
                                          <span className="disc-pending fw-bold">
                                            Inactive
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Newsletter
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {modal.newsLetter ? (
                                          <span className="news-active fw-bold">
                                            Subscribed
                                          </span>
                                        ) : (
                                          <span className="news-nonactive fw-bold">
                                            Unsubscribed
                                          </span>
                                        )}
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
                                            Last Modified
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
                                            Last Modified By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="file-container">
                                  {modal.loadingFile ? (
                                    <div className="text-center my-4">
                                      <div
                                        className="spinner-border text-primary"
                                        role="status"
                                      >
                                        <span className="visually-hidden">
                                          Loading...
                                        </span>
                                      </div>
                                    </div>
                                  ) : modal.fileUrl ? (
                                    <div className="mt-4 text-center">
                                      <h6 className="registration-file-heading">
                                        Business Registration File
                                      </h6>
                                      <div className="mt-3 mb-3">
                                        <a
                                          href={modal.fileUrl}
                                          download
                                          className="btn btn-theme btn-sm"
                                        >
                                          <i className="fa-solid fa-download me-1"></i>{" "}
                                          Download
                                        </a>
                                      </div>
                                      {modal.fileType === "application/pdf" ? (
                                        <iframe
                                          src={modal.fileUrl}
                                          title="Business Registration File"
                                          width="100%"
                                          height="970px"
                                          style={{
                                            borderRadius: "8px",
                                            border: "1px solid #ccc",
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={modal.fileUrl}
                                          alt="Business Registration"
                                          style={{
                                            maxWidth: "100%",
                                            height: "auto",
                                            borderRadius: "8px",
                                            border: "1px solid #ccc",
                                          }}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-center text-muted mt-4">
                                      No business registration file available.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Delete modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="deleteAgentModal"
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
                                    Agents Management | Delete
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Agent ID: </span>
                                    {modal.agentId}
                                    <br />
                                    <span className="fw-bold">
                                      Agent Name:{" "}
                                    </span>
                                    {modal.agentName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="deleteModalClose"
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
                                            Agent ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentEmail}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Phone Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentPhone}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Address
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentAddress}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Agent Business Registration Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agentBusinessRegistrationNo}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {modal.active ? (
                                          <span className="disc-active fw-bold">
                                            Active
                                          </span>
                                        ) : (
                                          <span className="disc-pending fw-bold">
                                            Inactive
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Newsletter
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {modal.newsLetter ? (
                                          <span className="news-active fw-bold">
                                            Subscribed
                                          </span>
                                        ) : (
                                          <span className="news-nonactive fw-bold">
                                            Unsubscribed
                                          </span>
                                        )}
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
                                            Last Modified
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
                                            Last Modified By
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="file-container">
                                  {modal.loadingFile ? (
                                    <div className="text-center my-4">
                                      <div
                                        className="spinner-border text-primary"
                                        role="status"
                                      >
                                        <span className="visually-hidden">
                                          Loading...
                                        </span>
                                      </div>
                                    </div>
                                  ) : modal.fileUrl ? (
                                    <div className="mt-4 text-center">
                                      <h6 className="registration-file-heading">
                                        Business Registration File
                                      </h6>
                                      <div className="mt-3 mb-3">
                                        <a
                                          href={modal.fileUrl}
                                          download
                                          className="btn btn-theme btn-sm download-btn "
                                        >
                                          <i className="fa-solid fa-download me-1"></i>{" "}
                                          Download
                                        </a>
                                      </div>
                                      {modal.fileType === "application/pdf" ? (
                                        <iframe
                                          src={modal.fileUrl}
                                          title="Business Registration File"
                                          width="100%"
                                          height="400px"
                                          style={{
                                            borderRadius: "8px",
                                            border: "1px solid #ccc",
                                          }}
                                        />
                                      ) : (
                                        <img
                                          src={modal.fileUrl}
                                          alt="Business Registration"
                                          style={{
                                            maxWidth: "100%",
                                            height: "auto",
                                            borderRadius: "8px",
                                            border: "1px solid #ccc",
                                          }}
                                        />
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-center text-muted mt-4">
                                      No business registration file available.
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <Form method="post">
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
                                        : "Delete Agent"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="deleteAgent"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="agentId"
                                      value={modal.agentId}
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
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="addAgentModal"
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
                                    Agents Management | Add
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="addModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <Form
                                  id="addAgentForm"
                                  method="post"
                                  encType="multipart/form-data"
                                >
                                  <br />
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentName"
                                        className="form-label fw-bold"
                                      >
                                        Agent Name
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentName"
                                        name="agentName"
                                        value={modal.agentName}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentName:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.add.agentName &&
                                        errors.add.agentName.length > 0 && (
                                          <div className="text-danger">
                                            {errors.add.agentName[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentEmail"
                                        className="form-label fw-bold"
                                      >
                                        Agent Email
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentEmail"
                                        name="agentEmail"
                                        value={modal.agentEmail}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentEmail:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.add.agentEmail &&
                                        errors.add.agentEmail.length > 0 && (
                                          <div className="text-danger">
                                            {errors.add.agentEmail[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentPhone"
                                        className="form-label fw-bold"
                                      >
                                        Agent Phone Number
                                      </label>
                                      <div className="input-group">
                                        <select
                                          className="form-select form-input-mod country-code"
                                          id="countryCode"
                                          name="countryCode"
                                          value={modal.countryCode}
                                          onChange={(event) => {
                                            const newCountryCode =
                                              event.target.value;
                                            setModal((prevModal) => ({
                                              ...prevModal,
                                              countryCode: newCountryCode,
                                            }));
                                          }}
                                          disabled={
                                            navigation.state === "submitting"
                                          }
                                        >
                                          {getAllCountryCodes().map(
                                            (country) => (
                                              <option
                                                key={country.code}
                                                value={country.code}
                                              >
                                                {country.code}
                                              </option>
                                            )
                                          )}
                                        </select>

                                        {/* Phone Number Input */}
                                        <input
                                          type="tel"
                                          className={`form-control form-input-mod ${
                                            phoneWarning ? "border-danger" : ""
                                          }`}
                                          id="agentPhone"
                                          name="agentPhone"
                                          placeholder="XXXXXXXXXXX"
                                          maxLength={15}
                                          value={modal.agentPhone}
                                          onChange={(event) => {
                                            const newPhone =
                                              validatePhoneNumber(
                                                validateInputText(
                                                  event.target.value
                                                )
                                              );
                                            setModal((prevModal) => ({
                                              ...prevModal,
                                              agentPhone: newPhone,
                                            }));
                                          }}
                                          disabled={
                                            navigation.state === "submitting"
                                          }
                                        />
                                      </div>

                                      {phoneWarning && (
                                        <p className="error-already-exist">
                                          {phoneWarning}
                                        </p>
                                      )}

                                      {errors.add.agentPhone &&
                                        errors.add.agentPhone.length > 0 && (
                                          <div className="text-danger">
                                            {errors.add.agentPhone[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentAddress"
                                        className="form-label fw-bold"
                                      >
                                        Agent Address
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentAddress"
                                        name="agentAddress"
                                        value={modal.agentAddress}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentAddress:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.add.agentAddress &&
                                        errors.add.agentAddress.length > 0 && (
                                          <div className="text-danger">
                                            {errors.add.agentAddress[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentBusinessRegistrationNo"
                                        className="form-label fw-bold"
                                      >
                                        Agent Business Registration Number
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentBusinessRegistrationNo"
                                        name="agentBusinessRegistrationNo"
                                        value={
                                          modal.agentBusinessRegistrationNo
                                        }
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentBusinessRegistrationNo:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.add.agentBusinessRegistrationNo &&
                                        errors.add.agentBusinessRegistrationNo
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add
                                                .agentBusinessRegistrationNo[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="register-form-input dropzone-container">
                                      <label
                                        htmlFor="agentBusinessRegNumber"
                                        className="form-label fw-bold"
                                      >
                                        Agent Business Registration File
                                      </label>

                                      <Dropzone
                                        onDrop={(acceptedFiles) => {
                                          if (hiddenInputRef.current) {
                                            const dataTransfer =
                                              new DataTransfer();
                                            acceptedFiles.forEach((v) =>
                                              dataTransfer.items.add(v)
                                            );
                                            hiddenInputRef.current.files =
                                              dataTransfer.files;
                                          }
                                          setUploadedFiles(acceptedFiles);
                                          console.log(acceptedFiles);
                                          setErrorMessage(""); // clear any previous errors
                                        }}
                                        onDropRejected={(fileRejections) => {
                                          if (
                                            fileRejections &&
                                            fileRejections.length > 0
                                          ) {
                                            const rejection = fileRejections[0];
                                            const { errors } = rejection;

                                            const sizeError = errors.find(
                                              (e) => e.code === "file-too-large"
                                            );
                                            const typeError = errors.find(
                                              (e) =>
                                                e.code === "file-invalid-type"
                                            );
                                            const tooMany = errors.find(
                                              (e) => e.code === "too-many-files"
                                            );

                                            if (sizeError) {
                                              setErrorMessage(
                                                "File size exceeds 3MB limit."
                                              );
                                            } else if (typeError) {
                                              setErrorMessage(
                                                "File type not accepted."
                                              );
                                            } else if (tooMany) {
                                              setErrorMessage(
                                                "Only one file can be uploaded."
                                              );
                                            } else {
                                              setErrorMessage(
                                                "File could not be uploaded."
                                              );
                                            }
                                          }
                                        }}
                                        accept={{
                                          "application/pdf": [".pdf"],
                                          "image/jpeg": [".jpg", ".jpeg"],
                                          "image/png": [".png"],
                                        }}
                                        maxFiles={1}
                                        maxSize={3 * 1024 * 1024}
                                      >
                                        {({
                                          getRootProps,
                                          getInputProps,
                                          isDragActive,
                                        }) => (
                                          <div
                                            {...getRootProps({
                                              className: `dropzone ${
                                                errorMessage
                                                  ? "dropzone-reject"
                                                  : uploadedFiles.length > 0
                                                  ? "dropzone-success"
                                                  : isDragActive
                                                  ? "dropzone-active"
                                                  : ""
                                              }`,
                                            })}
                                          >
                                            <input {...getInputProps()} />
                                            <input
                                              type="file"
                                              name="agentBusinessRegistrationFile"
                                              ref={hiddenInputRef}
                                              style={{ display: "none" }}
                                            />
                                            {errorMessage ? (
                                              <p className="text-red-600">
                                                {errorMessage}
                                              </p>
                                            ) : uploadedFiles.length > 0 ? (
                                              <div className="uploaded-file-list">
                                                {uploadedFiles.map((file) => (
                                                  <div key={file.name}>
                                                    <strong>{file.name}</strong>{" "}
                                                    (
                                                    {(
                                                      file.size /
                                                      1024 /
                                                      1024
                                                    ).toFixed(2)}{" "}
                                                    MB)
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p>
                                                {isDragActive
                                                  ? "Drop your file here..."
                                                  : "Drag & drop or Click to upload a file (PDF, JPG, PNG). Max size 3MB."}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </Dropzone>
                                      {errors.add
                                        .agentBusinessRegistrationFile &&
                                        errors.add.agentBusinessRegistrationFile
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add
                                                .agentBusinessRegistrationFile[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-0">
                                      <div className="register-form-input register-checkbox">
                                        <label
                                          htmlFor="newsLetter"
                                          className="register-label-checkbox"
                                        >
                                          Subscribe to Newsletter
                                        </label>
                                        <label
                                          htmlFor="newsLetter"
                                          className="switch"
                                        >
                                          <input
                                            type="checkbox"
                                            id="newsLetter"
                                            name="newsLetter"
                                            disabled={
                                              navigation.state === "submitting"
                                            }
                                            checked={modal.newsLetter || false}
                                            onChange={(event) =>
                                              setModal((prevModal) => ({
                                                ...prevModal,
                                                newsLetter:
                                                  event.target.checked,
                                              }))
                                            }
                                          />
                                          <span className="slider"></span>
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="addAgent"
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    form="addAgentForm"
                                    className="btn btn-theme btn-sm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add New Agent"}
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
                          id="editAgentModal"
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
                                    Agents Management | Edit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Customer ID:{" "}
                                    </span>
                                    {modal.agentId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.static.agentName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="editModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <Form
                                  id="editForm"
                                  method="post"
                                  encType="multipart/form-data"
                                >
                                  <br />
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentName"
                                        className="form-label fw-bold"
                                      >
                                        Agent Name
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentName"
                                        name="agentName"
                                        value={modal.agentName}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentName:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.edit.agentName &&
                                        errors.edit.agentName.length > 0 && (
                                          <div className="text-danger">
                                            {errors.edit.agentName[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentEmail"
                                        className="form-label fw-bold"
                                      >
                                        Agent Email
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentEmail"
                                        name="agentEmail"
                                        value={modal.agentEmail}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentEmail:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.edit.agentEmail &&
                                        errors.edit.agentEmail.length > 0 && (
                                          <div className="text-danger">
                                            {errors.edit.agentEmail[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentPhone"
                                        className="form-label fw-bold"
                                      >
                                        Agent Phone Number
                                      </label>
                                      <input
                                        type="tel"
                                        className="form-control form-input-mod"
                                        id="agentPhone"
                                        name="agentPhone"
                                        maxLength={15}
                                        value={modal.agentPhone}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentPhone:
                                                validatePhoneNumberWithCode(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.edit.agentPhone &&
                                        errors.edit.agentPhone.length > 0 && (
                                          <div className="text-danger">
                                            {errors.edit.agentPhone[0].message}
                                          </div>
                                        )}
                                      <div
                                        id="passwordDisclaimer"
                                        className="form-text"
                                      >
                                        <strong>
                                          The Phone number must start with the
                                          country code.
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentAddress"
                                        className="form-label fw-bold"
                                      >
                                        Agent Address
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentAddress"
                                        name="agentAddress"
                                        value={modal.agentAddress}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentAddress:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.edit.agentAddress &&
                                        errors.edit.agentAddress.length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit.agentAddress[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="agentBusinessRegistrationNo"
                                        className="form-label fw-bold"
                                      >
                                        Agent Business Registration Number
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="agentBusinessRegistrationNo"
                                        name="agentBusinessRegistrationNo"
                                        value={
                                          modal.agentBusinessRegistrationNo
                                        }
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentBusinessRegistrationNo:
                                                validateInputTextNoUpperCase(
                                                  event.target.value
                                                ),
                                            };
                                          });
                                        }}
                                        disabled={
                                          navigation.state === "submitting"
                                        }
                                      />
                                      {errors.edit
                                        .agentBusinessRegistrationNo &&
                                        errors.edit.agentBusinessRegistrationNo
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit
                                                .agentBusinessRegistrationNo[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="register-form-input dropzone-container">
                                      <label
                                        htmlFor="agentBusinessRegNumber"
                                        className="form-label fw-bold"
                                      >
                                        Agent Business Registration File
                                      </label>

                                      <Dropzone
                                        onDrop={(acceptedFiles) => {
                                          if (hiddenInputRef.current) {
                                            const dataTransfer =
                                              new DataTransfer();
                                            acceptedFiles.forEach((v) =>
                                              dataTransfer.items.add(v)
                                            );
                                            hiddenInputRef.current.files =
                                              dataTransfer.files;
                                          }
                                          setUploadedFiles(acceptedFiles);
                                          console.log(acceptedFiles);
                                          setErrorMessage(""); // clear any previous errors
                                        }}
                                        onDropRejected={(fileRejections) => {
                                          if (
                                            fileRejections &&
                                            fileRejections.length > 0
                                          ) {
                                            const rejection = fileRejections[0];
                                            const { errors } = rejection;

                                            const sizeError = errors.find(
                                              (e) => e.code === "file-too-large"
                                            );
                                            const typeError = errors.find(
                                              (e) =>
                                                e.code === "file-invalid-type"
                                            );
                                            const tooMany = errors.find(
                                              (e) => e.code === "too-many-files"
                                            );

                                            if (sizeError) {
                                              setErrorMessage(
                                                "File size exceeds 3MB limit."
                                              );
                                            } else if (typeError) {
                                              setErrorMessage(
                                                "File type not accepted."
                                              );
                                            } else if (tooMany) {
                                              setErrorMessage(
                                                "Only one file can be uploaded."
                                              );
                                            } else {
                                              setErrorMessage(
                                                "File could not be uploaded."
                                              );
                                            }
                                          }
                                        }}
                                        accept={{
                                          "application/pdf": [".pdf"],
                                          "image/jpeg": [".jpg", ".jpeg"],
                                          "image/png": [".png"],
                                        }}
                                        maxFiles={1}
                                        maxSize={3 * 1024 * 1024}
                                      >
                                        {({
                                          getRootProps,
                                          getInputProps,
                                          isDragActive,
                                        }) => (
                                          <div
                                            {...getRootProps({
                                              className: `dropzone ${
                                                errorMessage
                                                  ? "dropzone-reject"
                                                  : uploadedFiles.length > 0
                                                  ? "dropzone-success"
                                                  : isDragActive
                                                  ? "dropzone-active"
                                                  : ""
                                              }`,
                                            })}
                                          >
                                            <input {...getInputProps()} />
                                            <input
                                              type="file"
                                              name="agentBusinessRegistrationFile"
                                              ref={hiddenInputRef}
                                              style={{ display: "none" }}
                                            />
                                            {errorMessage ? (
                                              <p className="text-red-600">
                                                {errorMessage}
                                              </p>
                                            ) : uploadedFiles.length > 0 ? (
                                              <div className="uploaded-file-list">
                                                {uploadedFiles.map((file) => (
                                                  <div key={file.name}>
                                                    <strong>{file.name}</strong>{" "}
                                                    (
                                                    {(
                                                      file.size /
                                                      1024 /
                                                      1024
                                                    ).toFixed(2)}{" "}
                                                    MB)
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p>
                                                {isDragActive
                                                  ? "Drop your file here..."
                                                  : "Drag & drop or Click to upload a file (PDF, JPG, PNG). Max size 3MB."}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </Dropzone>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-0">
                                      <div className="register-form-input register-checkbox">
                                        <label
                                          htmlFor="newsLetter"
                                          className="register-label-checkbox"
                                        >
                                          Subscribe to Newsletter
                                        </label>
                                        <label
                                          htmlFor="newsLetter"
                                          className="switch"
                                        >
                                          <input
                                            type="checkbox"
                                            id="newsLetter"
                                            name="newsLetter"
                                            disabled={
                                              navigation.state === "submitting"
                                            }
                                            checked={modal.newsLetter || false}
                                            onChange={(event) =>
                                              setModal((prevModal) => ({
                                                ...prevModal,
                                                newsLetter:
                                                  event.target.checked,
                                              }))
                                            }
                                          />
                                          <span className="slider"></span>
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-0">
                                      <div className="register-form-input register-checkbox agent-status">
                                        <div className="col fw-bold px-3 status-text">
                                          <label>Agent Status</label>
                                        </div>

                                        <div className="col">
                                          <div className="form-check form-switch my-0 float-end d-flex align-items-center">
                                            {modal.active ? (
                                              <span className="disc-active fw-bold edit-active">
                                                Active
                                              </span>
                                            ) : (
                                              <span className="disc-pending fw-bold edit-active">
                                                Inactive
                                              </span>
                                            )}
                                            <label
                                              htmlFor="active"
                                              className="switch"
                                            >
                                              <input
                                                type="checkbox"
                                                id="active"
                                                name="active"
                                                disabled={
                                                  navigation.state ===
                                                  "submitting"
                                                }
                                                checked={modal.active}
                                                onChange={(event) => {
                                                  setModal((prevModal) => ({
                                                    ...prevModal,
                                                    active:
                                                      event.target.checked,
                                                  }));
                                                }}
                                              />
                                              <span className="slider"></span>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="editAgent"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="agentId"
                                    value={modal.agentId}
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
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    form="editForm"
                                    className="btn btn-theme btn-sm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-pen"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Edit Agent"}
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
