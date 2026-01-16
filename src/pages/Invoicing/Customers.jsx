import React, { Suspense, useEffect, useRef, useState } from "react";
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
  searchCustomers,
  deleteCustomer,
  addCustomer,
  editCustomer,
} from "../../api/invoicing/CustomerApi";
import ServerMessageToast from "../../components/ServerMessageToast";
import {
  validateInputText,
  validatePhoneNumber,
  validatePhoneNumberWithCode,
  validateInputTextNoUpperCase,
  getAllCountryCodes,
} from "../../utils/StringUtils";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "customerId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const filterValue = url.searchParams.get("filterValue") || "all";
  const customersDataAPI = await searchCustomers(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const customersData = { authentication, customersDataAPI };
  return defer(customersData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  if (formType === "deleteCustomer") {
    const customerId = formData.get("customerId");
    const batchNo = formData.get("batchNo");
    if (customerId === null || customerId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let deleteCustomerResponse = await deleteCustomer(customerId, batchNo);
    if (deleteCustomerResponse !== null) {
      deleteCustomerResponse = {
        ...deleteCustomerResponse,
        formType: formType,
      };
      return deleteCustomerResponse;
    }
  }
  if (formType === "addCustomer") {
    const customerName = formData.get("customerName");
    const customerEmail = formData.get("customerEmail");
    const countryCode = formData.get("countryCode");
    let customerPhone = formData.get("customerPhone");
    const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let response = { errors: [] };
    if (
      !customerName ||
      customerName === "" ||
      !inputRegex.test(customerName)
    ) {
      response.errors.push({
        name: "addCustomerName",
        message:
          "Please enter a valid Customer name using only letters, numbers, and spaces.",
      });
    }
    console.log(customerName);
    if (
      customerEmail === null ||
      customerEmail === "" ||
      !emailRegex.test(customerEmail)
    ) {
      response.errors.push({
        name: "addCustomerEmail",
        message: "Please enter a valid Customer Email.",
      });
    }
    if (
      customerPhone === null ||
      customerPhone === "" ||
      customerPhone.length < 9 ||
      customerPhone.length > 14
    ) {
      response.errors.push({
        name: "addCustomerPhone",
        message: "Please enter a valid customer phone number.",
      });
    }

    customerPhone = `${countryCode || ""}${customerPhone || ""}`.trim();

    console.log(customerPhone);

    if (response.errors.length !== 0) {
      response = { ...response, formType: "addUsers" };
      return response;
    } else {
      let addCustomerResponse = await addCustomer(
        customerName,
        customerEmail,
        customerPhone
      );
      if (addCustomerResponse !== null) {
        addCustomerResponse = {
          ...addCustomerResponse,
          formType: formType,
        };
        return addCustomerResponse;
      }
    }
  }
  if (formType === "editCustomer") {
    const customerName = formData.get("customerName");
    const customerPhone = formData.get("customerPhone");
    const customerEmail = formData.get("customerEmail");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

    let active = formData.get("active");
    const customerId = formData.get("customerId");
    const batchNo = formData.get("batchNo");
    let response = { errors: [] };

    if (
      customerName === null ||
      customerName === "" ||
      !inputRegex.test(customerName)
    ) {
      response.errors.push({
        name: "editCustomerName",
        message: "Please enter a valid customer name.",
      });
    }
    if (
      customerEmail === null ||
      customerEmail === "" ||
      !emailRegex.test(customerEmail)
    ) {
      response.errors.push({
        name: "editCustomerEmail",
        message: "Please enter a valid Customer Email.",
      });
    }
    if (
      isNaN(customerPhone) ||
      customerPhone === null ||
      customerPhone === ""
    ) {
      response.errors.push({
        name: "editCustomerPhone",
        message: "Please enter a valid Customer Phone Number.",
      });
    }
    if (active === null || active === "") {
      active = false;
    } else {
      active = true;
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: formType };
      return response;
    } else {
      if (customerId === null || customerId === "") {
        return null;
      }
      if (batchNo === null || batchNo === "") {
        return null;
      }
      let editCustomerResponse = await editCustomer(
        customerName,
        customerEmail,
        customerPhone,
        active,
        customerId,
        batchNo
      );
      if (editCustomerResponse !== null) {
        editCustomerResponse = {
          ...editCustomerResponse,
          formType: formType,
        };
        return editCustomerResponse;
      }
    }
  }
}

export default function Customers() {
  const { customersDataAPI, authentication } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const response = useActionData();
  const navigation = useNavigation();
  const [searchForm, setSearchForm] = useState({});
  const searchFormSubmitRef = useRef(null);
  const [phoneWarning, setPhoneWarning] = useState(null);
  const [errors, setErrors] = useState({
    add: {
      customerName: null,
      customerPhone: null,
      customerEmail: null,
      token: null,
    },
    edit: {
      customerName: null,
      customerPhone: null,
      customerEmail: null,
    },
  });

  const [modal, setModal] = useState({
    authorities: {
      add: false,
      edit: true,
      delete: true,
      view: true,
      privileges: false,
      update: false,
      resetPassword: false,
    },
    static: {
      customerId: "",
      customerName: "",
    },
    hidden: {
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
    },
    batchNo: "",
    customerId: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    token: "",
    active: false,
  });

  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "customerId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
        page: searchParams.get("page") || "1",
        filterValue: searchParams.get("filterValue") || "all",
      };
    });
  }, [searchParams]);

  function clearModalData() {
    setModal(() => ({
      authorities: {
        add: false,
        edit: true,
        delete: true,
        view: true,
        privileges: false,
        update: false,
        resetPassword: false,
      },
      static: {
        customerId: "",
        customerName: "",
      },
      hidden: {
        created: "",
        createdBy: "",
        lastModified: "",
        lastModifiedBy: "",
      },
      batchNo: "",
      customerId: "",
      customerEmail: "",
      customerName: "",
      countryCode: "+49",
      customerPhone: "",
      active: false,
      token: "",
    }));
    setErrors(() => {
      return {
        add: {
          customerName: null,
          customerPhone: null,
          customerEmail: null,
          token: null,
        },
        edit: {
          customerName: null,
          customerPhone: null,
          customerEmail: null,
        },
      };
    });
  }

  useEffect(() => {
    setErrors(() => {
      return {
        add: {
          customerName: response?.errors?.filter(
            (o) => o.name === "addCustomerName"
          ),
          customerEmail: response?.errors?.filter(
            (o) => o.name === "addCustomerEmail"
          ),
          customerPhone: response?.errors?.filter(
            (o) => o.name === "addCustomerPhone"
          ),
          token: response?.errors?.filter((o) => o.name === "addPassword"),
        },
        edit: {
          customerName: response?.errors?.filter(
            (o) => o.name === "editCustomerName"
          ),
          customerEmail: response?.errors?.filter(
            (o) => o.name === "editCustomerEmail"
          ),
          customerPhone: response?.errors?.filter(
            (o) => o.name === "editCustomerPhone"
          ),
        },
      };
    });
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (response.formType === "addCustomer" && response.message.success) {
        document.getElementById("addModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "deleteCustomer" && response.message.success) {
        document.getElementById("deleteModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "approveCustomer" && response.message.success) {
        document.getElementById("approveModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "rejectCustomer" && response.message.success) {
        document.getElementById("approveModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "editCustomer" && response.message.success) {
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
    const combinedPhone = `${modal.countryCode}${modal.customerPhone}`;

    const isDuplicate = customersDataAPI.data.objects.some(
      (customer) => customer.customerPhone === combinedPhone
    );

    setPhoneWarning(
      isDuplicate ? "This phone number is already in use." : null
    );
  }, [modal.countryCode, modal.customerPhone]);

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
                <Await resolve={customersDataAPI}>
                  {({ data }) => {
                    const { authorities, pagination, objects } = data;
                    const datagrid = objects.map((customer) => {
                      return (
                        <tr key={customer.customerId}>
                          <td className="text-truncate">
                            {customer.customerId}
                          </td>
                          <td className="text-truncate">
                            {customer.customerName}
                          </td>
                          <td className="text-truncate">
                            {customer.customerEmail}
                          </td>
                          <td className="text-truncate">
                            {customer.customerPhone}
                          </td>
                          <td className="text-truncate">
                            {customer.active ? (
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
                                  data-bs-target="#viewCustomerModal"
                                  disabled={!customer.authorities.view}
                                  value={customer.customerId}
                                  onClick={() =>
                                    loadModalData(customer.customerId)
                                  }
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
                                  data-bs-target="#editCustomerModal"
                                  disabled={!customer.authorities.edit}
                                  value={customer.customerId}
                                  onClick={() =>
                                    loadModalData(customer.customerId)
                                  }
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
                                  data-bs-target="#deleteCustomerModal"
                                  disabled={!customer.authorities.delete}
                                  value={customer.customerId}
                                  onClick={() =>
                                    loadModalData(customer.customerId)
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

                    function loadModalData(customerId) {
                      const customer = objects.filter(
                        (customer) => customer.customerId === customerId
                      )[0];
                      setModal(() => {
                        return {
                          hidden: {
                            created: customer.created,
                            createdBy: customer.createdBy,
                            lastModified: customer.lastModified,
                            lastModifiedBy: customer.lastModifiedBy,
                          },
                          static: {
                            customerId: customer.customerId,
                            customerName: customer.customerName,
                          },
                          batchNo: customer.batchNo,
                          customerId: customer.customerId,
                          customerEmail: customer.customerEmail,
                          customerName: customer.customerName,
                          customerPhone: customer.customerPhone,
                          active: customer.active,
                          token: customer.token,
                        };
                      });
                      setErrors(() => {
                        return {
                          add: {
                            customerName: null,
                            customerPhone: null,
                            customerEmail: null,
                            token: null,
                          },

                          edit: {
                            customerName: null,
                            customerPhone: null,
                            customerEmail: null,
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
                                <div className="col title-grn">
                                  <h4 className="page-header user-heading">
                                    Customers Management
                                  </h4>
                                </div>
                                <div className="col text-end add-btn">
                                  <button
                                    className="btn btn-theme btn-sm"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addCustomerModal"
                                    disabled={!authorities.add}
                                    onClick={clearModalData}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;Customer&nbsp;&nbsp;&nbsp;
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
                                        <option value="customerId">
                                          Customer&nbsp;ID
                                        </option>
                                        <option value="customerName">
                                          Customer&nbsp;Name
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
                                              Customer&nbsp;ID
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
                                                        "customerId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType: "customerId",
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
                                                    "customerId"
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
                                              Customer&nbsp;Name
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
                                                        "customerName"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "customerName",
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
                                                    "customerName"
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
                                              Customer&nbsp;Email
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
                                                        "customerEmail"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "customerEmail",
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
                                                    "customerEmail"
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
                                              Customer&nbsp;Phone&nbsp;Number
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
                                                        "customerPhone"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "customerPhone",
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
                                                    "customerPhone"
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
                                    <tbody>{dataGridOffset(datagrid)}</tbody>
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
                          id="viewCustomerModal"
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
                                    Customers Management | View
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Customer ID:{" "}
                                    </span>
                                    {modal.customerId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customerName}
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
                                            Customer ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerEmail}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Phone Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerPhone}
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
                                            Created Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.hidden.created}
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
                                        {modal.hidden.createdBy}
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
                                        {modal.hidden.lastModified}
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
                                        {modal.hidden.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Delete modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="deleteCustomerModal"
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
                                    Customers Management | Delete
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Customer ID:{" "}
                                    </span>
                                    {modal.customerId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customerName}
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
                                            Customer ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerName}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Email
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerEmail}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer Phone Number
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customerPhone}
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
                                            Created Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.hidden.created}
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
                                        {modal.hidden.createdBy}
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
                                        {modal.hidden.lastModified}
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
                                        {modal.hidden.lastModifiedBy}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
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
                                        : "Delete Customer"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="deleteCustomer"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="customerId"
                                      value={modal.customerId}
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
                          id="addCustomerModal"
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
                                    Customers Management | Add
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
                                <Form id="addCustomersForm" method="post">
                                  <br />
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerName"
                                        className="form-label fw-bold"
                                      >
                                        Customer Name
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="customerName"
                                        name="customerName"
                                        value={modal.customerName}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              customerName:
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
                                      {errors.add.customerName &&
                                        errors.add.customerName.length > 0 && (
                                          <div className="text-danger">
                                            {errors.add.customerName[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerEmail"
                                        className="form-label fw-bold"
                                      >
                                        Customer Email
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="customerEmail"
                                        name="customerEmail"
                                        value={modal.customerEmail}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              customerEmail:
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
                                      {errors.add.customerEmail &&
                                        errors.add.customerEmail.length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add.customerEmail[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerPhone"
                                        className="form-label fw-bold"
                                      >
                                        Customer Phone Number
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
                                          id="customerPhone"
                                          name="customerPhone"
                                          placeholder="XXXXXXXXXXX"
                                          maxLength={15}
                                          value={modal.customerPhone}
                                          onChange={(event) => {
                                            const newPhone =
                                              validatePhoneNumber(
                                                validateInputText(
                                                  event.target.value
                                                )
                                              );
                                            setModal((prevModal) => ({
                                              ...prevModal,
                                              customerPhone: newPhone,
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

                                      {errors.add.customerPhone &&
                                        errors.add.customerPhone.length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add.customerPhone[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="addCustomer"
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    form="addCustomersForm"
                                    className="btn btn-theme btn-sm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add New Customer"}
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
                          id="editCustomerModal"
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
                                    Customers Management | Edit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Customer ID:{" "}
                                    </span>
                                    {modal.static.customerId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.static.customerName}
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
                                <Form id="editForm" method="post">
                                  <br />
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerName"
                                        className="form-label fw-bold"
                                      >
                                        Customer Name
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="customerName"
                                        name="customerName"
                                        value={modal.customerName}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              customerName:
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
                                      {errors.edit.customerName &&
                                        errors.edit.customerName.length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit.customerName[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerEmail"
                                        className="form-label fw-bold"
                                      >
                                        Customer Email
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="customerEmail"
                                        name="customerEmail"
                                        value={modal.customerEmail}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              customerEmail:
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
                                      {errors.edit.customerEmail &&
                                        errors.edit.customerEmail.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit.customerEmail[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="customerPhone"
                                        className="form-label fw-bold"
                                      >
                                        Customer Phone Number
                                      </label>
                                      <input
                                        type="tel"
                                        className="form-control form-input-mod"
                                        id="customerPhone"
                                        name="customerPhone"
                                        maxLength={15}
                                        value={modal.customerPhone}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              customerPhone:
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
                                      {errors.edit.customerPhone &&
                                        errors.edit.customerPhone.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit.customerPhone[0]
                                                .message
                                            }
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
                                  <div className="row mb-3">
                                    <div className="col border rounded p-2">
                                      <div className="row align-items-center">
                                        <div className="col fw-bold px-3 status-text">
                                          <label>Status</label>
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
                                            <input
                                              id="active"
                                              className="form-check-input form-switch-mod corporate-customer-switch-positioner "
                                              type="checkbox"
                                              role="switch"
                                              name="active"
                                              checked={modal.active}
                                              onChange={(event) => {
                                                setModal((prevModal) => ({
                                                  ...prevModal,
                                                  active: event.target.checked,
                                                }));
                                              }}
                                              disabled={
                                                navigation.state ===
                                                "submitting"
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="editCustomer"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="customerId"
                                    value={modal.customerId}
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
                                      : "Edit Customer"}
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
