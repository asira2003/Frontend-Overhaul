import React, { Suspense, useEffect, useRef, useState } from "react";
import {
  Form,
  useLoaderData,
  useActionData,
  useSearchParams,
  defer,
  Await,
  useNavigation,
} from "react-router-dom";
import { requireAuth } from "../../api/administration/authenticationApi";
import ContentThrobber from "../../components/throbbers/ContentThrobber";
import SessionTimoutError from "../../components/SessionTimeoutError";
import {
  searchTourInvoices,
  deleteTourInvoice,
  addTourInvoice,
  editTourInvoice,
  postTourInvoice,
  printTourInvoice,
  cancelTourInvoice,
  directDepositTourInvoices,
} from "../../api/invoicing/invoicesApi";
import ServerMessageToast from "../../components/ServerMessageToast";
import SearchFilterDropDown from "../../components/SearchFilterDropdown";
import {
  validateInputText,
  validateInputTextNoUpperCase,
  validatePhoneNumber,
  validatePhoneNumberWithCode,
  getAllCountryCodes,
} from "../../utils/StringUtils";
import visa from "../../assets/images/dashboard/visa.png";
import master from "../../assets/images/dashboard/master.png";
import amex from "../../assets/images/dashboard/amex.png";
import union from "../../assets/images/dashboard/union.png";
import { addCustomer, searchCustomers } from "../../api/invoicing/CustomerApi";
import BigNumber from "bignumber.js";
import CustomQuillEditor from "../../components/CustomQuillEditor";
import DOMPurify from "dompurify";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "tourInvoiceId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const filterValue = url.searchParams.get("filterValue") || "all";
  const tourInvoicesDataApi = await searchTourInvoices(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const CustomerDataAPI = await searchCustomers(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const tourInvoicesData = {
    authentication,
    tourInvoicesDataApi,
    CustomerDataAPI,
  };
  return defer(tourInvoicesData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

  if (formType === "deleteInvoice") {
    const tourInvoiceId = formData.get("tourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (tourInvoiceId === null || tourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let deleteTourInvoiceResponse = await deleteTourInvoice(
      tourInvoiceId,
      batchNo
    );
    if (deleteTourInvoiceResponse !== null) {
      deleteTourInvoiceResponse = {
        ...deleteTourInvoiceResponse,
        formType: formType,
      };
      return deleteTourInvoiceResponse;
    }
  }

  if (formType === "cancelInvoice") {
    const tourInvoiceId = formData.get("tourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (tourInvoiceId === null || tourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let cancelTourInvoiceResponse = await cancelTourInvoice(
      tourInvoiceId,
      batchNo
    );
    if (cancelTourInvoiceResponse !== null) {
      cancelTourInvoiceResponse = {
        ...cancelTourInvoiceResponse,
        formType: formType,
      };
      return cancelTourInvoiceResponse;
    }
  }

  if (formType === "directDeposit") {
    const tourInvoiceId = formData.get("tourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (tourInvoiceId === null || tourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let directDepositResponse = await directDepositTourInvoices(
      tourInvoiceId,
      batchNo
    );
    if (directDepositResponse !== null) {
      directDepositResponse = {
        ...directDepositResponse,
        formType: formType,
      };
      return directDepositResponse;
    }
  }

  if (formType === "addInvoice") {
    const customerId = formData.get("customerId");
    const items = JSON.parse(formData.get("items"));
    const tourInvoiceTitle = formData.get("tourInvoiceTitle");
    let tourInvoiceDescription = formData.get("tourInvoiceDescription");
    tourInvoiceDescription = DOMPurify.sanitize(tourInvoiceDescription, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "em",
        "strong",
        "br",
      ],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
    let response = { errors: [] };
    if (customerId === null || customerId === "") {
      response.errors.push({
        name: "addCustomer",
        message: "Please select a customer from the given list.",
      });
    }
    if (
      tourInvoiceTitle === null ||
      tourInvoiceTitle === "" ||
      !inputRegex.test(tourInvoiceTitle)
    ) {
      response.errors.push({
        name: "addTitle",
        message: "Please enter a valid Title.",
      });
    }
    if (items === null || items.length <= 0) {
      response.errors.push({
        name: "addPricing",
        message: "Please enter at least one tour item.",
      });
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: "addInvoice" };
      return response;
    } else {
      const newItemsArr = [];
      items.map((item) => {
        newItemsArr.push({
          itemId: item.itemId,
          itemDate: item.itemDate,
          itemDescription: item.itemDescription,
          itemPrice: item.itemPrice,
        });
      });
      console.log(newItemsArr);
      let addTourInvoiceResponse = await addTourInvoice(
        tourInvoiceTitle,
        tourInvoiceDescription,
        newItemsArr,
        customerId
      );
      if (addTourInvoiceResponse !== null) {
        addTourInvoiceResponse = {
          ...addTourInvoiceResponse,
          formType: formType,
        };
        return addTourInvoiceResponse;
      }
    }
  }

  if (formType === "editInvoice") {
    const items = JSON.parse(formData.get("items"));
    const batchNo = formData.get("batchNo");
    const tourInvoiceId = formData.get("tourInvoiceId");
    const tourInvoiceTitle = formData.get("tourInvoiceTitle");
    let tourInvoiceDescription = formData.get("tourInvoiceDescription");
    const tourInvoicePricing = formData.get("tourInvoicePricing");
    tourInvoiceDescription = DOMPurify.sanitize(tourInvoiceDescription, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "em",
        "strong",
        "br",
      ],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
    let response = { errors: [] };
    if (batchNo === null || batchNo === "") {
      return null;
    }
    if (tourInvoiceId === null || tourInvoiceId === "") {
      return null;
    }
    if (
      tourInvoiceTitle === null ||
      tourInvoiceTitle === "" ||
      !inputRegex.test(tourInvoiceTitle)
    ) {
      response.errors.push({
        name: "editTitle",
        message: "Please enter a valid Title.",
      });
    }
    if (items === null || items.length <= 0) {
      response.errors.push({
        name: "editPricing",
        message: "Please enter at least one tour item.",
      });
    }
    if (response.errors.length !== 0) {
      response = { ...response, formType: formType };
      return response;
    } else {
      const newItemsArr = [];
      items.map((item) => {
        newItemsArr.push({
          itemId: item.itemId,
          itemDate: item.itemDate,
          itemDescription: item.itemDescription,
          itemPrice: item.itemPrice,
        });
      });
      let editTourInvoiceResponse = await editTourInvoice(
        tourInvoiceTitle,
        tourInvoiceDescription,
        tourInvoicePricing,
        tourInvoiceId,
        batchNo,
        newItemsArr
      );
      if (editTourInvoiceResponse !== null) {
        editTourInvoiceResponse = {
          ...editTourInvoiceResponse,
          formType: formType,
        };
        return editTourInvoiceResponse;
      }
    }
  }

  if (formType === "postInvoice") {
    const items = JSON.parse(formData.get("items"));
    const batchNo = formData.get("batchNo");
    const tourInvoiceId = formData.get("tourInvoiceId");
    const tourInvoiceTitle = formData.get("tourInvoiceTitle");
    let tourInvoiceDescription = formData.get("tourInvoiceDescription");
    const tourInvoicePricing = formData.get("tourInvoicePricing");
    tourInvoiceDescription = DOMPurify.sanitize(tourInvoiceDescription, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "em",
        "strong",
        "br",
      ],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
    let response = { errors: [] };
    if (batchNo === null || batchNo === "") {
      return null;
    }
    if (tourInvoiceId === null || tourInvoiceId === "") {
      return null;
    }
    if (
      tourInvoiceTitle === null ||
      tourInvoiceTitle === "" ||
      !inputRegex.test(tourInvoiceTitle)
    ) {
      response.errors.push({
        name: "postTitle",
        message: "Please enter a valid Title.",
      });
    }

    if (items === null || items.length <= 0) {
      response.errors.push({
        name: "postPricing",
        message: "Please enter at least one tour item.",
      });
    }

    if (response.errors.length !== 0) {
      response = { ...response, formType: formType };
      return response;
    } else {
      const newItemsArr = [];
      items.map((item) => {
        newItemsArr.push({
          itemId: item.itemId,
          itemDate: item.itemDate,
          itemDescription: item.itemDescription,
          itemPrice: item.itemPrice,
        });
      });
      let postTourInvoiceResponse = await postTourInvoice(
        tourInvoiceTitle,
        tourInvoiceDescription,
        tourInvoicePricing,
        tourInvoiceId,
        batchNo,
        newItemsArr
      );
      if (postTourInvoiceResponse !== null) {
        postTourInvoiceResponse = {
          ...postTourInvoiceResponse,
          formType: formType,
        };
        return postTourInvoiceResponse;
      }
    }
  }

  if (formType === "printInvoice") {
    const tourInvoiceNumber = formData.get("tourInvoiceNumber");
    console.log(tourInvoiceNumber);
    if (tourInvoiceNumber === null || tourInvoiceNumber === "") {
      return null;
    }
    let responseBlob = await printTourInvoice(tourInvoiceNumber);
    if (responseBlob !== null) {
      return {
        message: { success: true, message: "Data successfully fetched." },
        errors: [],
        data: { responseBlob: responseBlob },
        formType: formType,
      };
    } else {
      return {
        message: {
          success: false,
          message: "An error occurred while fetching data. Please try again.",
        },
        errors: [],
        data: null,
        formType: formType,
      };
    }
  }

  if (formType === "addCustomer") {
    const customerName = formData.get("customerName");
    const customerEmail = formData.get("customerEmail");
    const countryCode = formData.get("countryCode");
    let customerPhone = formData.get("customerPhone");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let response = { errors: [] };
    if (
      customerName === null ||
      customerName === "" ||
      !inputRegex.test(customerName)
    ) {
      response.errors.push({
        name: "customerCustomerName",
        message: "Please enter a valid Customer name.",
      });
    }
    if (
      customerEmail === null ||
      customerEmail === "" ||
      !emailRegex.test(customerEmail)
    ) {
      response.errors.push({
        name: "customerCustomerEmail",
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
        name: "customerCustomerPhone",
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
  return null;
}

export default function TourInvoices() {
  const { tourInvoicesDataApi, CustomerDataAPI, authentication } =
    useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const response = useActionData();
  const navigation = useNavigation();
  const [searchForm, setSearchForm] = useState({});
  const searchFormSubmitRef = useRef(null);
  const [tempVal, setTempVal] = useState();
  const [valSwitch, setValSwitch] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(null);

  const [errors, setErrors] = useState({
    add: {
      customerId: null,
      tourInvoiceTitle: null,
      tourInvoiceDescription: null,
      tourInvoicePricing: null,
    },
    edit: {
      tourInvoiceTitle: null,
      tourInvoiceDescription: null,
      tourInvoicePricing: null,
    },
    post: {
      tourInvoiceTitle: null,
      tourInvoiceDescription: null,
      tourInvoicePricing: null,
    },
    customer: {
      customerName: null,
      customerPhone: null,
      customerEmail: null,
      token: null,
    },
  });

  const [showEditDetails, setShowEditDetails] = useState(false);
  const toggleDetails = () => {
    setShowEditDetails((prev) => !prev);
  };

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
    },
    batchNo: "",
    created: "",
    createdBy: "",
    lastModified: "",
    lastModifiedBy: "",
    tourInvoiceId: "",
    tourInvoiceDate: "",
    tourInvoiceTitle: "",
    tourInvoiceDescription: "",
    tourInvoicePricing: "",
    items: [],
    customer: {
      authorities: "",
      batchNo: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      customerId: "",
      customerEmail: "",
      token: "",
      customerName: "",
      customerPhone: "",
      active: false,
    },
    tourInvoiceStatusId: "",
    payments: [],
  });

  const [customerModal, setCustomerModal] = useState({
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
    countryCode: "",
    token: "",
    active: false,
  });

  const [itemModal, setItemModal] = useState({
    keyVal: "",
    index: -1,
    caller: "",
    itemId: "",
    itemDate: "",
    itemDescription: "",
    itemPrice: 0,
  });

  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "tourInvoiceId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
        page: searchParams.get("page") || "1",
        filterValue: searchParams.get("filterValue") || "all",
      };
    });
  }, [searchParams]);

  useEffect(() => {
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (response.formType === "printInvoice" && response.message.success) {
        const url = window.URL.createObjectURL(
          new Blob([response.data.responseBlob], {
            type: "application/pdf",
          })
        );
        document.getElementById("pdfIframe").src = url;
      }
    }
    setErrors(() => {
      return {
        add: {
          customerId: response?.errors?.filter((o) => o.name === "addCustomer"),
          tourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "addTitle"
          ),
          tourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "addDescription"
          ),
          tourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "addPricing"
          ),
        },
        edit: {
          tourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "editTitle"
          ),
          tourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "editDescription"
          ),
          tourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "editPricing"
          ),
        },
        post: {
          tourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "postTitle"
          ),
          tourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "postDescription"
          ),
          tourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "postPricing"
          ),
        },
        customer: {
          customerName: response?.errors?.filter(
            (o) => o.name === "customerCustomerName"
          ),
          customerEmail: response?.errors?.filter(
            (o) => o.name === "customerCustomerEmail"
          ),
          customerPhone: response?.errors?.filter(
            (o) => o.name === "customerCustomerPhone"
          ),
          token: response?.errors?.filter((o) => o.name === "customerPassword"),
        },
      };
    });
    if (
      response !== undefined &&
      response !== null &&
      response.message !== undefined
    ) {
      if (response.formType === "addInvoice" && response.message.success) {
        document.getElementById("addModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }
      if (response.formType === "deleteInvoice" && response.message.success) {
        document.getElementById("deleteModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }

      if (response.formType === "editInvoice" && response.message.success) {
        document.getElementById("editModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }

      if (response.formType === "postInvoice" && response.message.success) {
        document.getElementById("postModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }

      if (response.formType === "directDeposit" && response.message.success) {
        document.getElementById("directDepositModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }

      if (response.formType === "cancelInvoice" && response.message.success) {
        document.getElementById("cancelModalClose").click();
        setTimeout(function () {
          clearModalData();
        }, 500);
      }

      if (response.formType === "addCustomer" && response.message.success) {
        document.getElementById("addCustomerModalClose").click();
        setTimeout(function () {
          setModal((prev) => {
            return {
              ...prev,
              customer: {
                ...modal.customer,
                customerId: response.data,
              },
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

  const [customersState, setCustomersState] = useState([]);

  useEffect(() => {
    const combinedPhone = `${customerModal.countryCode}${customerModal.customerPhone}`;

    const isDuplicate = CustomerDataAPI.data.objects.some(
      (customer) => customer.customerPhone === combinedPhone
    );

    setPhoneWarning(
      isDuplicate ? "This phone number is already in use." : null
    );
  }, [customerModal.countryCode, customerModal.customerPhone]);

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
                <Await resolve={tourInvoicesDataApi}>
                  {({ data }) => {
                    const {
                      authorities,
                      pagination,
                      objects,
                      customers,
                      tourInvoiceStatuses,
                    } = data;

                    useEffect(() => {
                      // Update customer list state
                      const newCustomers = customers.map((x) => x);
                      setCustomersState(() => {
                        return newCustomers;
                      });
                    }, [tourInvoicesDataApi]);

                    const datagrid = objects.map((tourInvoice) => {
                      return (
                        <tr
                          key={tourInvoice.tourInvoiceId}
                          className="table-row-invoice"
                        >
                          <td className="text-truncate double-row">
                            {tourInvoice.tourInvoiceId}
                          </td>
                          <td className="text-truncate double-row">
                            {tourInvoice.tourInvoiceDate}
                          </td>
                          <td className="text-truncate double-row title-row">
                            {tourInvoice.tourInvoiceTitle}
                          </td>
                          <td className="text-truncate double-row text-end price-row">
                            {tourInvoice.tourInvoicePricing}&nbsp;EUR
                          </td>
                          <td className="text-truncate double-row">
                            {(() => {
                              const statusMap = {
                                "PE-1": {
                                  className: "status draft tour-status-admin",
                                  iconClass: "ri-draft-line status-icon",
                                  text: "PRO FORMA INVOICE",
                                },
                                "PE-2": {
                                  className: "status pending tour-status-admin",
                                  iconClass: "ri-time-line status-icon",
                                  text: "PAYMENT PENDING",
                                },

                                "PE-3": {
                                  className:
                                    "status complete tour-status-admin",
                                  iconClass: "fa-solid fa-check",
                                  text: "PAYMENT COMPLETE",
                                },
                                "PE-4": {
                                  className:
                                    "status cancelled tour-status-admin",
                                  iconClass:
                                    "fa-solid fa-circle-xmark status-icon cancelled",
                                  text: "CANCELLED",
                                },
                                "PE-5": {
                                  className: "status deposit tour-status-admin",
                                  iconClass: "ri-wallet-3-line status-icon",
                                  text: "DIRECT DEPOSIT",
                                },
                              };

                              const status =
                                statusMap[tourInvoice.tourInvoiceStatusId];

                              return status ? (
                                <span className={status.className}>
                                  <i className={status.iconClass}></i>
                                  &nbsp;&nbsp;{status.text}
                                </span>
                              ) : null;
                            })()}
                          </td>

                          <td className="text-truncate double-row">
                            {tourInvoice.customer.customerName}
                          </td>

                          <td className="double-row">
                            <div className="row button-grid">
                              <div className="col col-1">
                                <Form method="post">
                                  <button
                                    type="submit"
                                    className="action-btn tour-inv-btn"
                                    title="Print Invoice"
                                    data-bs-toggle="modal"
                                    data-bs-target="#printInvoiceModal"
                                    disabled={!tourInvoice.authorities.print}
                                  >
                                    <i className="fa-solid fa-print"></i>
                                  </button>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="printInvoice"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="tourInvoiceNumber"
                                    value={tourInvoice.tourInvoiceId}
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn tour-inv-btn"
                                  title="View"
                                  data-bs-toggle="modal"
                                  data-bs-target="#viewInvoiceModal"
                                  disabled={!tourInvoice.authorities.view}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-eye"></i>
                                </button>
                              </div>
                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn"
                                  title="Edit"
                                  data-bs-toggle="modal"
                                  data-bs-target="#editInvoiceModal"
                                  disabled={!tourInvoice.authorities.edit}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-pen"></i>
                                </button>
                              </div>
                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn"
                                  title="Post"
                                  data-bs-toggle="modal"
                                  data-bs-target="#postInvoiceModal"
                                  disabled={!tourInvoice.authorities.post}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-solid fa-paper-plane"></i>
                                </button>
                              </div>
                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn"
                                  title="Payment History"
                                  data-bs-toggle="modal"
                                  data-bs-target="#paymentModal"
                                  disabled={!tourInvoice.authorities.payments}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-solid fa-money-check-dollar"></i>
                                </button>
                              </div>

                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn delete-btn"
                                  title="Direct Deposit"
                                  data-bs-toggle="modal"
                                  data-bs-target="#directDepositInvoiceModal"
                                  disabled={
                                    !tourInvoice.authorities.directDeposit
                                  }
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-solid fa-money-bill-transfer"></i>
                                </button>
                              </div>

                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn delete-btn"
                                  title="Cancel Invoice"
                                  data-bs-toggle="modal"
                                  data-bs-target="#cancelInvoiceModal"
                                  disabled={!tourInvoice.authorities.cancel}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
                                  }
                                >
                                  <i className="fa-solid fa-ban"></i>
                                </button>
                              </div>

                              <div className="col col-1">
                                <button
                                  type="button"
                                  className="action-btn tour-inv-btn delete-btn"
                                  title="Delete"
                                  data-bs-toggle="modal"
                                  data-bs-target="#deleteInvoiceModal"
                                  disabled={!tourInvoice.authorities.delete}
                                  value={tourInvoice.tourInvoiceId}
                                  onClick={() =>
                                    loadModalData(tourInvoice.tourInvoiceId)
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

                    const inActiveItemsGrid = modal.items?.map((item) => {
                      return (
                        <tr key={modal.items.indexOf(item)}>
                          <td>{item.itemId}</td>
                          <td>{item.itemDate}</td>
                          <td>{item.itemDescription}</td>
                          <td className="text-end">{`${new BigNumber(
                            item.itemPrice
                          ).toFixed(2, 0)} EUR`}</td>
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

                            <td>&nbsp;</td>
                          </tr>
                        );
                      }
                      return dataGrid;
                    }

                    function clearModalData() {
                      setTempVal(() => "");
                      setValSwitch(() => !valSwitch);
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
                        },
                        batchNo: "",
                        created: "",
                        createdBy: "",
                        lastModified: "",
                        lastModifiedBy: "",
                        tourInvoiceId: "",
                        tourInvoiceDate: "",
                        tourInvoiceTitle: "",
                        tourInvoiceDescription: "",
                        tourInvoicePricing: "",
                        items: [],
                        customer: {
                          authorities: "",
                          batchNo: "",
                          created: "",
                          createdBy: "",
                          lastModified: "",
                          lastModifiedBy: "",
                          customerId: "",
                          customerEmail: "",
                          token: "",
                          customerName: "",
                          customerPhone: "",
                          active: false,
                        },
                        tourInvoiceStatusId: "",
                        payments: [],
                      }));
                      // Reset errors
                      setErrors(() => {
                        return {
                          add: {
                            customerId: null,
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },
                          edit: {
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },
                          post: {
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },
                          customer: {
                            customerName: null,
                            customerPhone: null,
                            customerEmail: null,
                            token: null,
                          },
                        };
                      });
                      // Update customer list state
                      const newCustomers = customers.map((x) => x);
                      setCustomersState(() => {
                        return newCustomers;
                      });
                    }

                    function loadModalData(tourInvoiceId) {
                      const tourInvoice = objects.filter(
                        (tourInvoice) =>
                          tourInvoice.tourInvoiceId === tourInvoiceId
                      )[0];
                      const newCustomerArray = customers.map(
                        (customer) => customer
                      );
                      setCustomersState(() => {
                        return newCustomerArray;
                      });
                      setTempVal(() => tourInvoice.tourInvoiceDescription);
                      setValSwitch(() => !valSwitch);
                      setModal(() => {
                        return {
                          batchNo: tourInvoice.batchNo,
                          created: tourInvoice.created,
                          createdBy: tourInvoice.createdBy,
                          lastModified: tourInvoice.lastModified,
                          lastModifiedBy: tourInvoice.lastModifiedBy,
                          tourInvoiceId: tourInvoice.tourInvoiceId,
                          tourInvoiceDate: tourInvoice.tourInvoiceDate,
                          tourInvoiceTitle: tourInvoice.tourInvoiceTitle,
                          tourInvoiceDescription:
                            tourInvoice.tourInvoiceDescription,
                          tourInvoicePricing: tourInvoice.tourInvoicePricing,
                          items: JSON.parse(JSON.stringify(tourInvoice.items)),
                          customer: {
                            authorities: tourInvoice.customer.authorities,
                            batchNo: tourInvoice.customer.batchNo,
                            created: tourInvoice.customer.created,
                            createdBy: tourInvoice.customer.createdBy,
                            lastModified: tourInvoice.customer.lastModified,
                            lastModifiedBy: tourInvoice.customer.lastModifiedBy,
                            customerId: tourInvoice.customer.customerId,
                            customerEmail: tourInvoice.customer.customerEmail,
                            token: tourInvoice.customer.token,
                            customerName: tourInvoice.customer.customerName,
                            customerPhone: tourInvoice.customer.customerPhone,
                            active: tourInvoice.customer.active,
                          },
                          tourInvoiceStatusId: tourInvoice.tourInvoiceStatusId,
                          payments: tourInvoice.payments,
                        };
                      });
                      setErrors(() => {
                        return {
                          add: {
                            customerId: null,
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },

                          edit: {
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },
                          post: {
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
                          },
                          customer: {
                            customerName: null,
                            customerPhone: null,
                            customerEmail: null,
                            token: null,
                          },
                        };
                      });
                    }

                    function clearCustomerModalData() {
                      setCustomerModal(() => ({
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
                        countryCode: "+49",
                        customerName: "",
                        customerPhone: "",
                        active: false,
                        token: "",
                      }));
                      setErrors((prev) => {
                        return {
                          ...prev,
                          customer: {
                            customerName: null,
                            customerPhone: null,
                            customerEmail: null,
                            token: null,
                          },
                        };
                      });
                    }

                    function renderActiveItemsGrid(caller) {
                      const activeItemsGrid = modal.items?.map((item) => {
                        return (
                          <tr key={modal.items.indexOf(item)}>
                            <td>{item.itemId}</td>
                            <td>{item.itemDate}</td>
                            <td>{item.itemDescription}</td>
                            <td className="text-end">{`${new BigNumber(
                              item.itemPrice
                            ).toFixed(2, 0)} EUR`}</td>
                            <td>
                              <div className="row justify-content-end">
                                <div className="col col-3">
                                  <button
                                    type="button"
                                    className="action-btn"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edititem"
                                    title="Edit"
                                    disabled={navigation.state === "submitting"}
                                    onClick={() => {
                                      const index = modal.items.indexOf(item);
                                      setItemModal(() => {
                                        return {
                                          keyVal: "",
                                          index: index,
                                          caller: caller,
                                          itemId: item.itemId,
                                          itemDate: item.itemDate,
                                          itemDescription: item.itemDescription,
                                          itemPrice: item.itemPrice,
                                        };
                                      });
                                    }}
                                  >
                                    <i className="fa-sharp fa-solid fa-pen"></i>
                                  </button>
                                </div>
                                <div className="col col-3">
                                  <button
                                    type="button"
                                    className="action-btn delete-btn"
                                    title="Delete"
                                    disabled={navigation.state === "submitting"}
                                    onClick={() => {
                                      const newItems = JSON.parse(
                                        JSON.stringify(modal.items)
                                      );
                                      const index = modal.items.indexOf(item);
                                      if (index > -1) {
                                        newItems.splice(index, 1);
                                        setModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            items: newItems,
                                            tourInvoicePricing: new BigNumber(
                                              prevModal.tourInvoicePricing
                                            )
                                              .minus(
                                                new BigNumber(item.itemPrice)
                                              )
                                              .toFixed(2, 0),
                                          };
                                        });
                                      }
                                    }}
                                  >
                                    <i className="fa-sharp fa-solid fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                      return activeItemsGrid;
                    }

                    return (
                      <>
                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 mb-3 align-items-center user-content">
                                <div className="col title-grn">
                                  <h4 className="page-header user-heading">
                                    Customer Tour Invoice Management
                                  </h4>
                                </div>
                                <div className="col text-end add-btn pt-3">
                                  <button
                                    className="btn btn-theme btn-sm"
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addInvoiceModal"
                                    disabled={!authorities.add}
                                    onClick={clearModalData}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;Tour&nbsp;Invoice&nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                              <div className="row justify-content-end mb-3">
                                <div className="col table-row">
                                  <div className="row align-items-center">
                                    <div className="col-xxl-5 col-10">
                                      <select
                                        form="searchForm"
                                        id="filterValue"
                                        name="filterValue"
                                        className="form-select form-select-sm form-select-mod filter-value"
                                        value={searchForm.filterValue}
                                        onChange={(event) => {
                                          setSearchForm((prevSearchForm) => ({
                                            ...prevSearchForm,
                                            filterValue: event.target.value,
                                          }));
                                          setTimeout(() => {
                                            searchFormSubmitRef.current.click();
                                          }, 0);
                                        }}
                                      >
                                        <option value="all">ALL</option>
                                        {tourInvoiceStatuses.map((status) => (
                                          <option
                                            key={status.id}
                                            value={status.id}
                                          >
                                            {status.description}
                                          </option>
                                        ))}
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
                                <div className="col col-3">
                                  <div className="row align-items-center">
                                    <div className="col search-by-col-1 text-end">
                                      <label className="fw-bold">
                                        Search by:{" "}
                                      </label>
                                    </div>
                                    <div className="col search-by-col-2">
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
                                        <option value="tourInvoiceId">
                                          Tour&nbsp;Invoice&nbsp;ID
                                        </option>
                                        <option value="tourInvoiceDate">
                                          Tour&nbsp;Invoice&nbsp;Date
                                        </option>
                                        <option value="tourInvoiceTitle">
                                          Title
                                        </option>
                                        <option value="customerName">
                                          Customer Name
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="col col-3">
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
                                        <th className="tour-invoice-table-header">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Tour&nbsp;Invoice&nbsp;ID
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
                                                        "tourInvoiceId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInvoiceId",
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
                                                    "tourInvoiceId"
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
                                        <th
                                          width="18%"
                                          className="tour-invoice-table-header"
                                        >
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Tour&nbsp;Invoice&nbsp;Date
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
                                                        "tourInvoiceDate"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInvoiceDate",
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
                                                    "tourInvoiceDate"
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
                                        <th className="text-truncate tour-invoice-table-header">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Title
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
                                                        "tourInvoiceTitle"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInvoiceTitle",
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
                                                    "tourInvoiceTitle"
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
                                        <th className="text-truncate tour-invoice-table-header">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Invoice&nbsp;Price
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
                                                        "tourInvoicePricing"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInvoicePricing",
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
                                                    "tourInvoicePricing"
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
                                        <th className="text-truncate tour-invoice-table-header">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Status
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
                                                        "tourInvoiceStatusId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInvoiceStatusId",
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
                                                    "tourInvoiceStatusId"
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
                                        <th className="text-truncate tour-invoice-table-header">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Customer
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

                                        <th className="tour-invoice-table-header">
                                          Action
                                        </th>
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
                        {/* view modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="viewInvoiceModal"
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
                                    Customer Tour Invoice Management | View
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="viewModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                ></button>
                              </div>
                              <div className="modal-body">
                                {modal.tourInvoiceStatusId === "PE-1" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text active">
                                      PRO&nbsp;FORMA
                                      </div>
                                      <div className="counter active">1</div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text">POST</div>
                                      <div className="counter">2</div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text">
                                        PAYMENT&nbsp;PENDING
                                      </div>
                                      <div className="counter">3</div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInvoiceStatusId === "PE-2" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                      PRO&nbsp;FORMA
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        POST
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text active">
                                        PAYMENT&nbsp;PENDING
                                      </div>
                                      <div className="counter active">3</div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInvoiceStatusId === "PE-3" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                      PRO&nbsp;FORMA
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        POST
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        PAYMENT&nbsp;COMPLETED
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInvoiceStatusId === "PE-4" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                      PRO&nbsp;FORMA
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        POST
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text decline">
                                        CANCELLED
                                      </div>
                                      <div className="counter decline">
                                        <i className="fa-solid fa-xmark"></i>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInvoiceStatusId === "PE-5" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                      PRO&nbsp;FORMA
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        POST
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        PAYMENT&nbsp;COMPLETED
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row" width="50%">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceDate}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {(() => {
                                          const statusMap = {
                                            "PE-2": {
                                              className:
                                                "status pending tour-status-admin",
                                              iconClass:
                                                "ri-time-line status-icon",
                                              text: "PAYMENT PENDING",
                                            },
                                            "PE-1": {
                                              className:
                                                "status draft tour-status-admin",
                                              iconClass:
                                                "ri-draft-line status-icon",
                                              text: "PRO FORMA INVOICE",
                                            },
                                            "PE-3": {
                                              className:
                                                "status complete tour-status-admin",
                                              iconClass: "fa-solid fa-check",
                                              text: "PAYMENT COMPLETE",
                                            },
                                            "PE-5": {
                                              className:
                                                "status deposit tour-status-admin",
                                              iconClass:
                                                "ri-wallet-3-line status-icon",
                                              text: "DIRECT DEPOSIT",
                                            },
                                            "PE-4": {
                                              className:
                                                "status cancelled tour-status-admin",
                                              iconClass:
                                                "fa-solid fa-circle-xmark status-icon cancelled",
                                              text: "CANCELLED",
                                            },
                                          };

                                          const status =
                                            statusMap[
                                              modal.tourInvoiceStatusId
                                            ];

                                          return status ? (
                                            <span className={status.className}>
                                              <i
                                                className={status.iconClass}
                                              ></i>
                                              &nbsp;&nbsp;{status.text}
                                            </span>
                                          ) : null;
                                        })()}
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
                                        {modal.customer.customerName}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="col">&nbsp;</div>
                                <button
                                  onClick={toggleDetails}
                                  className="btn-show"
                                >
                                  {showEditDetails ? (
                                    <>
                                      <i className="fa-solid fa-angle-up show-icon"></i>{" "}
                                      Hide Audit Details
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa-solid fa-angle-down show-icon"></i>{" "}
                                      Show Audit Details
                                    </>
                                  )}
                                </button>

                                {showEditDetails && (
                                  <table className="table table-hover mt-3">
                                    <tbody>
                                      <tr>
                                        <th scope="row" width="50%">
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
                                )}
                                <div className="text-content mt-4">
                                  <h5 className="article-heading">
                                    {modal.tourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.tourInvoiceDescription,
                                    }}
                                  />
                                </div>
                                <div className="row add-price">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="ItemDescription"
                                      className="form-label fw-bold add-customer-email-label"
                                    >
                                      Tour Items
                                    </label>
                                    <div className="row g-3">
                                      <div className="mb-4">
                                        <table className="table table-hover">
                                          <thead>
                                            <tr>
                                              <th className="col-3">
                                                Item Identifier (System)
                                              </th>
                                              <th className="col-3">
                                                Item Date
                                              </th>
                                              <th className="col-3">
                                                Item Description
                                              </th>
                                              <th className="col-3 text-end">
                                                Item Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>{inActiveItemsGrid}</tbody>
                                        </table>
                                      </div>
                                    </div>
                                    <table className="table table-hover">
                                      <tbody>
                                        <td className="fw-bold fs-5 ps-3">
                                          Total Pricing
                                        </td>
                                        <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                          modal.tourInvoicePricing === ""
                                            ? "0"
                                            : modal.tourInvoicePricing
                                        ).toFixed(2, 0)} EUR`}</td>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* delete modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="deleteInvoiceModal"
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
                                    Customer Tour Invoice Management | Delete
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.tourInvoiceId}
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
                                      <th scope="row" width="50%">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceDate}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate">
                                        {(() => {
                                          const statusMap = {
                                            "PE-2": {
                                              className:
                                                "status pending tour-status-admin",
                                              iconClass:
                                                "ri-time-line status-icon",
                                              text: "PAYMENT PENDING",
                                            },
                                            "PE-1": {
                                              className:
                                                "status draft tour-status-admin",
                                              iconClass:
                                                "ri-draft-line status-icon",
                                              text: "PRO FORMA INVOICE",
                                            },
                                            "PE-3": {
                                              className:
                                                "status complete tour-status-admin",
                                              iconClass: "fa-solid fa-check",
                                              text: "PAYMENT COMPLETE",
                                            },
                                            "PE-5": {
                                              className:
                                                "status deposit tour-status-admin",
                                              iconClass:
                                                "ri-wallet-3-line status-icon",
                                              text: "DIRECT DEPOSIT",
                                            },
                                            "PE-4": {
                                              className:
                                                "status cancelled tour-status-admin",
                                              iconClass:
                                                "fa-solid fa-circle-xmark status-icon cancelled",
                                              text: "CANCELLED",
                                            },
                                          };

                                          const status =
                                            statusMap[
                                              modal.tourInvoiceStatusId
                                            ];

                                          return status ? (
                                            <span className={status.className}>
                                              <i
                                                className={status.iconClass}
                                              ></i>
                                              &nbsp;&nbsp;{status.text}
                                            </span>
                                          ) : null;
                                        })()}
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
                                        {modal.customer.customerName}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="col">&nbsp;</div>
                                <button
                                  onClick={toggleDetails}
                                  className="btn-show"
                                >
                                  {showEditDetails ? (
                                    <>
                                      <i className="fa-solid fa-angle-up show-icon"></i>{" "}
                                      Hide Audit Details
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa-solid fa-angle-down show-icon"></i>{" "}
                                      Show Audit Details
                                    </>
                                  )}
                                </button>

                                {showEditDetails && (
                                  <table className="table table-hover mt-3">
                                    <tbody>
                                      <tr>
                                        <th scope="row" width="50%">
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
                                )}
                                <div className="text-content mt-4">
                                  <h5 className="article-heading">
                                    {modal.tourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.tourInvoiceDescription,
                                    }}
                                  />
                                </div>
                                <div className="row add-price">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="ItemDescription"
                                      className="form-label fw-bold add-customer-email-label"
                                    >
                                      Tour Items
                                    </label>
                                    <div className="row g-3">
                                      <div className="mb-4">
                                        <table className="table table-hover">
                                          <thead>
                                            <tr>
                                              <th className="col-3">
                                                Item Identifier (System)
                                              </th>
                                              <th className="col-3">
                                                Item Date
                                              </th>
                                              <th className="col-3">
                                                Item Description
                                              </th>
                                              <th className="col-3 text-end">
                                                Item Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>{inActiveItemsGrid}</tbody>
                                        </table>
                                      </div>
                                    </div>
                                    <table className="table table-hover">
                                      <tbody>
                                        <td className="fw-bold fs-5 ps-3">
                                          Total Pricing
                                        </td>
                                        <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                          modal.tourInvoicePricing === ""
                                            ? "0"
                                            : modal.tourInvoicePricing
                                        ).toFixed(2, 0)} EUR`}</td>
                                      </tbody>
                                    </table>
                                  </div>
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
                                        : "Delete Tour Invoice"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="deleteInvoice"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="tourInvoiceId"
                                      value={modal.tourInvoiceId}
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
                        {/* add modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="addInvoiceModal"
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
                                    Customer Tour Invoice Management | Add
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
                                <br />
                                <Form id="addForm" method="post">
                                  <div className="row">
                                    <div className="col-12 mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold"
                                      >
                                        Customer
                                      </label>
                                      <div className="row pe-2 mb-2">
                                        <div className="col-12 text-end add-btn pe-2">
                                          <button
                                            type="button"
                                            className="btn btn-theme btn-sm"
                                            disabled={
                                              navigation.state === "submitting"
                                            }
                                            data-bs-toggle="modal"
                                            data-bs-target="#addCustomerModal"
                                            onClick={() => {
                                              clearCustomerModalData();
                                            }}
                                          >
                                            &nbsp;
                                            <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                            &nbsp;&nbsp; {"Add New Customer"}
                                            &nbsp;&nbsp;&nbsp;
                                          </button>
                                        </div>
                                      </div>
                                      <SearchFilterDropDown
                                        dataList={customersState}
                                        value={modal.customer.customerId}
                                        handleChange={(customerId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              customer: {
                                                ...prev.customer,
                                                customerId: customerId,
                                              },
                                            };
                                          });
                                        }}
                                      />

                                      {errors.add.customerId &&
                                        errors.add.customerId.length > 0 && (
                                          <div className="text-danger mt-4 pt-1">
                                            {errors.add.customerId[0].message}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-customer-email">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Title
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="title"
                                        name="tourInvoiceTitle"
                                        value={modal.tourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              tourInvoiceTitle:
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
                                      {errors.add.tourInvoiceTitle &&
                                        errors.add.tourInvoiceTitle.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add.tourInvoiceTitle[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-customer-des">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Description (Optional)
                                      </label>
                                      <CustomQuillEditor
                                        value={tempVal}
                                        handleChange={(description) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              tourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                  </div>
                                  <div className="">
                                    {errors.add.tourInvoiceDescription &&
                                      errors.add.tourInvoiceDescription.length >
                                        0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add.tourInvoiceDescription[0]
                                              .message
                                          }
                                        </div>
                                      )}
                                  </div>
                                  <div className="row add-price">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Items
                                      </label>
                                      <div className="col text-end add-btn pe-2">
                                        <button
                                          className="btn btn-theme btn-sm add-to-grn-btn"
                                          type="button"
                                          data-bs-toggle="modal"
                                          data-bs-target="#additem"
                                          onClick={() => {
                                            setItemModal(() => {
                                              return {
                                                caller: "addInvoiceModal",
                                                keyVal: "",
                                                index: -1,
                                                itemId: "",
                                                itemDate: "",
                                                itemDescription: "",
                                                itemPrice: 0,
                                              };
                                            });
                                          }}
                                          disabled={
                                            navigation.state === "submitting"
                                          }
                                        >
                                          &nbsp;
                                          <i className="fa-sharp fa-solid fa-plus"></i>
                                          &nbsp;&nbsp;Add&nbsp;Tour&nbsp;Item&nbsp;&nbsp;&nbsp;
                                        </button>
                                      </div>
                                      <div className="row g-3">
                                        <div className="mb-4">
                                          {errors.add.tourInvoicePricing &&
                                            errors.add.tourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.add
                                                    .tourInvoicePricing[0]
                                                    .message
                                                }
                                              </div>
                                            )}
                                          <table className="table table-hover">
                                            <thead>
                                              <tr>
                                                <th className="col-3">
                                                  Item Identifier (System)
                                                </th>
                                                <th className="col-3">
                                                  Item Date
                                                </th>
                                                <th className="col-3">
                                                  Item Description
                                                </th>
                                                <th className="col-3 text-end">
                                                  Item Price
                                                </th>
                                                <th className="col-3 text-end">
                                                  Action
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {renderActiveItemsGrid(
                                                "addInvoiceModal"
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      <table className="table table-hover">
                                        <tbody>
                                          <td className="fw-bold fs-5 ps-3">
                                            Total Pricing
                                          </td>
                                          <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                            modal.tourInvoicePricing === ""
                                              ? "0"
                                              : modal.tourInvoicePricing
                                          ).toFixed(2, 0)} EUR`}</td>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="addInvoice"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="customerId"
                                    value={modal.customer.customerId}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="tourInvoiceDescription"
                                    value={modal.tourInvoiceDescription}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="items"
                                    value={JSON.stringify(modal.items)}
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    form="addForm"
                                    className="btn btn-theme btn-sm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add New Tour Invoice"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* edit modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="editInvoiceModal"
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
                                    Customer Tour Invoice Management | Edit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="editModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <br />
                                <div className="step-counter-container">
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                    PRO&nbsp;FORMA
                                    </div>
                                    <div className="counter active">1</div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text">POST</div>
                                    <div className="counter">2</div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text">
                                      PAYMENT&nbsp;PENDING
                                    </div>
                                    <div className="counter">3</div>
                                  </div>
                                </div>
                                <Form id="editForm" method="post">
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold"
                                      >
                                        Customer
                                      </label>
                                      <SearchFilterDropDown
                                        dataList={customersState}
                                        disabled
                                        value={modal.customer.customerId}
                                        handleChange={(customerId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              customer: {
                                                ...prev.customer,
                                                customerId: customerId,
                                              },
                                            };
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="row add-customer-email">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Title
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="tourInvoiceTitle"
                                        name="tourInvoiceTitle"
                                        value={modal.tourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              tourInvoiceTitle:
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
                                      {errors.edit.tourInvoiceTitle &&
                                        errors.edit.tourInvoiceTitle.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit.tourInvoiceTitle[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-customer-des">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Description (Optional)
                                      </label>
                                      <CustomQuillEditor
                                        value={tempVal}
                                        handleChange={(description) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              tourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                    <div className="">
                                      {errors.edit.tourInvoiceDescription &&
                                        errors.edit.tourInvoiceDescription
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit
                                                .tourInvoiceDescription[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-price">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Items
                                      </label>
                                      <div className="col text-end add-btn pe-2">
                                        <button
                                          className="btn btn-theme btn-sm add-to-grn-btn"
                                          type="button"
                                          data-bs-toggle="modal"
                                          data-bs-target="#additem"
                                          onClick={() => {
                                            setItemModal(() => {
                                              return {
                                                caller: "editInvoiceModal",
                                                keyVal: "",
                                                index: -1,
                                                itemId: "",
                                                itemDate: "",
                                                itemDescription: "",
                                                itemPrice: 0,
                                              };
                                            });
                                          }}
                                          disabled={
                                            navigation.state === "submitting"
                                          }
                                        >
                                          &nbsp;
                                          <i className="fa-sharp fa-solid fa-plus"></i>
                                          &nbsp;&nbsp;Add&nbsp;Tour&nbsp;Item&nbsp;&nbsp;&nbsp;
                                        </button>
                                      </div>
                                      <div className="row g-3">
                                        <div className="mb-4">
                                          {errors.add.tourInvoicePricing &&
                                            errors.add.tourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.add
                                                    .tourInvoicePricing[0]
                                                    .message
                                                }
                                              </div>
                                            )}
                                          <table className="table table-hover">
                                            <thead>
                                              <tr>
                                                <th className="col-3">
                                                  Item Identifier (System)
                                                </th>
                                                <th className="col-3">
                                                  Item Date
                                                </th>
                                                <th className="col-3">
                                                  Item Description
                                                </th>
                                                <th className="col-3 text-end">
                                                  Item Price
                                                </th>
                                                <th className="col-3 text-end">
                                                  Action
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {renderActiveItemsGrid(
                                                "editInvoiceModal"
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      <table className="table table-hover">
                                        <tbody>
                                          <td className="fw-bold fs-5 ps-3">
                                            Total Pricing
                                          </td>
                                          <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                            modal.tourInvoicePricing === ""
                                              ? "0"
                                              : modal.tourInvoicePricing
                                          ).toFixed(2, 0)} EUR`}</td>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="editInvoice"
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
                                    name="tourInvoiceDescription"
                                    value={modal.tourInvoiceDescription}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="tourInvoiceId"
                                    value={modal.tourInvoiceId}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="items"
                                    value={JSON.stringify(modal.items)}
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
                                      : "Edit Tour Invoice"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* post modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="postInvoiceModal"
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
                                    Customer Tour Invoice Management | Post
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="postModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <br />
                                <div className="step-counter-container">
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                    PRO&nbsp;FORMA
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                      POST
                                    </div>
                                    <div className="counter active">2</div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text">
                                      PAYMENT&nbsp;PENDING
                                    </div>
                                    <div className="counter">3</div>
                                  </div>
                                </div>
                                <Form id="postForm" method="post">
                                  <div className="row">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold"
                                      >
                                        Customer
                                      </label>
                                      <SearchFilterDropDown
                                        dataList={customersState}
                                        disabled
                                        value={modal.customer.customerId}
                                        handleChange={(customerId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              customer: {
                                                ...prev.customer,
                                                customerId: customerId,
                                              },
                                            };
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="row add-customer-email">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Title
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control form-input-mod"
                                        id="tourInvoiceTitle"
                                        name="tourInvoiceTitle"
                                        value={modal.tourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              tourInvoiceTitle:
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
                                      {errors.post.tourInvoiceTitle &&
                                        errors.post.tourInvoiceTitle.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.post.tourInvoiceTitle[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-customer-des">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Description (Optional)
                                      </label>
                                      <CustomQuillEditor
                                        value={tempVal}
                                        handleChange={(description) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              tourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                    <div className="">
                                      {errors.post.tourInvoiceDescription &&
                                        errors.post.tourInvoiceDescription
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.post
                                                .tourInvoiceDescription[0]
                                                .message
                                            }
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                  <div className="row add-price">
                                    <div className="col mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold add-customer-email-label"
                                      >
                                        Tour Items
                                      </label>
                                      <div className="col text-end add-btn pe-2">
                                        <button
                                          className="btn btn-theme btn-sm add-to-grn-btn"
                                          type="button"
                                          data-bs-toggle="modal"
                                          data-bs-target="#additem"
                                          onClick={() => {
                                            setItemModal(() => {
                                              return {
                                                caller: "postInvoiceModal",
                                                keyVal: "",
                                                index: -1,
                                                itemId: "",
                                                itemDate: "",
                                                itemDescription: "",
                                                itemPrice: 0,
                                              };
                                            });
                                          }}
                                          disabled={
                                            navigation.state === "submitting"
                                          }
                                        >
                                          &nbsp;
                                          <i className="fa-sharp fa-solid fa-plus"></i>
                                          &nbsp;&nbsp;Add&nbsp;Tour&nbsp;Item&nbsp;&nbsp;&nbsp;
                                        </button>
                                      </div>
                                      <div className="row g-3">
                                        <div className="mb-4">
                                          {errors.add.tourInvoicePricing &&
                                            errors.add.tourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.add
                                                    .tourInvoicePricing[0]
                                                    .message
                                                }
                                              </div>
                                            )}
                                          <table className="table table-hover">
                                            <thead>
                                              <tr>
                                                <th className="col-3">
                                                  Item Identifier (System)
                                                </th>
                                                <th className="col-3">
                                                  Item Date
                                                </th>
                                                <th className="col-3">
                                                  Item Description
                                                </th>
                                                <th className="col-3 text-end">
                                                  Item Price
                                                </th>
                                                <th className="col-3 text-end">
                                                  Action
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {renderActiveItemsGrid(
                                                "postInvoiceModal"
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      <table className="table table-hover">
                                        <tbody>
                                          <td className="fw-bold fs-5 ps-3">
                                            Total Pricing
                                          </td>
                                          <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                            modal.tourInvoicePricing === ""
                                              ? "0"
                                              : modal.tourInvoicePricing
                                          ).toFixed(2, 0)} EUR`}</td>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                  <input
                                    type="hidden"
                                    name="formType"
                                    value="postInvoice"
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
                                    name="tourInvoiceId"
                                    value={modal.tourInvoiceId}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="tourInvoiceDescription"
                                    value={modal.tourInvoiceDescription}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="items"
                                    value={JSON.stringify(modal.items)}
                                    readOnly={true}
                                  />
                                </Form>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="submit"
                                    form="postForm"
                                    className="btn btn-theme btn-sm"
                                    disabled={navigation.state === "submitting"}
                                  >
                                    &nbsp;
                                    <i className="fa-solid fa-paper-plane"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Post Tour Invoice"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* print modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="printInvoiceModal"
                          data-bs-backdrop="static"
                          data-bs-keyboard="false"
                          tabIndex="-1"
                          aria-hidden="true"
                        >
                          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                              <div className="modal-header align-items-start">
                                <button
                                  type="button"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div
                                  className={`pdfobject-container${
                                    navigation.state === "submitting"
                                      ? "-hidden"
                                      : ""
                                  }`}
                                >
                                  <iframe
                                    id="pdfIframe"
                                    src=""
                                    type="application/pdf"
                                    width="100%"
                                    height="100%"
                                    className="iframe-overflow"
                                  ></iframe>
                                </div>
                                {navigation.state === "submitting" ? (
                                  <div className="row pdfobject-container justify-content-center">
                                    <div className="col text-center align-self-center">
                                      <div className="throbber-con-content">
                                        <span
                                          className="spinner-border throbber-con"
                                          role="status"
                                        ></span>
                                        <span className="align-text-bottom fw-bold">
                                          &nbsp;&nbsp;Please Wait...
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* direct deposit modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="directDepositInvoiceModal"
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
                                    Customer Tour Invoice Management | Direct
                                    Deposit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="directDepositModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="step-counter-container">
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                    PRO&nbsp;FORMA
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                      POST
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                      PAYMENT&nbsp;PENDING
                                    </div>
                                    <div className="counter active">3</div>
                                  </div>
                                </div>
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row" width="50%">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceDate}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceStatusId ===
                                        "PE-2" ? (
                                          <>
                                            {" "}
                                            <span className="status pending tour-status-admin">
                                              <i className="ri-time-line status-icon"></i>
                                              &nbsp;&nbsp;PAYMENT&nbsp;PENDING
                                            </span>
                                          </>
                                        ) : modal.tourInvoiceStatusId ===
                                          "PE-1" ? (
                                          <>
                                            {" "}
                                            <span className="status draft tour-status-admin">
                                              <i className="ri-draft-line status-icon"></i>
                                              &nbsp;&nbsp;PRO&nbsp;FORMA&nbsp;INVOICE
                                            </span>
                                          </>
                                        ) : modal.tourInvoiceStatusId ===
                                          "PE-3" ? (
                                          <>
                                            {" "}
                                            <span className="status complete tour-status-admin">
                                              <i className="fa-solid fa-check"></i>
                                              &nbsp;&nbsp;PAYMENT&nbsp;COMPLETE
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="status cancelled tour-status-admin">
                                              <i className="fa-solid fa-circle-xmark status-icon cancelled"></i>
                                              &nbsp;&nbsp;CANCELLED
                                            </span>
                                          </>
                                        )}
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
                                        {modal.customer.customerName}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="col">&nbsp;</div>
                                <button
                                  onClick={toggleDetails}
                                  className="btn-show"
                                >
                                  {showEditDetails ? (
                                    <>
                                      <i className="fa-solid fa-angle-up show-icon"></i>{" "}
                                      Hide Audit Details
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa-solid fa-angle-down show-icon"></i>{" "}
                                      Show Audit Details
                                    </>
                                  )}
                                </button>

                                {showEditDetails && (
                                  <table className="table table-hover mt-3">
                                    <tbody>
                                      <tr>
                                        <th scope="row" width="50%">
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
                                )}
                                <div className="text-content mt-4">
                                  <h5 className="article-heading">
                                    {modal.tourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.tourInvoiceDescription,
                                    }}
                                  />
                                </div>
                                <div className="row add-price">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="ItemDescription"
                                      className="form-label fw-bold add-customer-email-label"
                                    >
                                      Tour Items
                                    </label>
                                    <div className="row g-3">
                                      <div className="mb-4">
                                        <table className="table table-hover">
                                          <thead>
                                            <tr>
                                              <th className="col-3">
                                                Item Identifier (System)
                                              </th>
                                              <th className="col-3">
                                                Item Date
                                              </th>
                                              <th className="col-3">
                                                Item Description
                                              </th>
                                              <th className="col-3 text-end">
                                                Item Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>{inActiveItemsGrid}</tbody>
                                        </table>
                                      </div>
                                    </div>
                                    <table className="table table-hover">
                                      <tbody>
                                        <td className="fw-bold fs-5 ps-3">
                                          Total Pricing
                                        </td>
                                        <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                          modal.tourInvoicePricing === ""
                                            ? "0"
                                            : modal.tourInvoicePricing
                                        ).toFixed(2, 0)} EUR`}</td>
                                      </tbody>
                                    </table>
                                  </div>
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
                                      <i className="fa-solid fa-money-bill-transfer"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Direct Deposit"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="directDeposit"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="tourInvoiceId"
                                      value={modal.tourInvoiceId}
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

                        {/* cancel modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="cancelInvoiceModal"
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
                                    Customer Tour Invoice Management | Cancel
                                    Invoice
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="cancelModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="step-counter-container">
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                    PRO&nbsp;FORMA
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                      POST
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                      PAYMENT&nbsp;PENDING
                                    </div>
                                    <div className="counter active">3</div>
                                  </div>
                                </div>
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row" width="50%">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceDate}
                                      </td>
                                    </tr>

                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Invoice Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInvoiceStatusId ===
                                        "PE-2" ? (
                                          <>
                                            {" "}
                                            <span className="status pending tour-status-admin">
                                              <i className="ri-time-line status-icon"></i>
                                              &nbsp;&nbsp;PAYMENT&nbsp;PENDING
                                            </span>
                                          </>
                                        ) : modal.tourInvoiceStatusId ===
                                          "PE-1" ? (
                                          <>
                                            {" "}
                                            <span className="status draft tour-status-admin">
                                              <i className="ri-draft-line status-icon"></i>
                                              &nbsp;&nbsp;PRO&nbsp;FORMA&nbsp;INVOICE
                                            </span>
                                          </>
                                        ) : modal.tourInvoiceStatusId ===
                                          "PE-3" ? (
                                          <>
                                            {" "}
                                            <span className="status complete tour-status-admin">
                                              <i className="fa-solid fa-check"></i>
                                              &nbsp;&nbsp;PAYMENT&nbsp;COMPLETE
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="status cancelled tour-status-admin">
                                              <i className="fa-solid fa-circle-xmark status-icon cancelled"></i>
                                              &nbsp;&nbsp;CANCELLED
                                            </span>
                                          </>
                                        )}
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
                                        {modal.customer.customerName}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <div className="col">&nbsp;</div>
                                <button
                                  onClick={toggleDetails}
                                  className="btn-show"
                                >
                                  {showEditDetails ? (
                                    <>
                                      <i className="fa-solid fa-angle-up show-icon"></i>{" "}
                                      Hide Audit Details
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa-solid fa-angle-down show-icon"></i>{" "}
                                      Show Audit Details
                                    </>
                                  )}
                                </button>

                                {showEditDetails && (
                                  <table className="table table-hover mt-3">
                                    <tbody>
                                      <tr>
                                        <th scope="row" width="50%">
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
                                )}
                                <div className="text-content mt-4">
                                  <h5 className="article-heading">
                                    {modal.tourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.tourInvoiceDescription,
                                    }}
                                  />
                                </div>
                                <div className="row add-price">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="ItemDescription"
                                      className="form-label fw-bold add-customer-email-label"
                                    >
                                      Tour Items
                                    </label>
                                    <div className="row g-3">
                                      <div className="mb-4">
                                        <table className="table table-hover">
                                          <thead>
                                            <tr>
                                              <th className="col-3">
                                                Item Identifier (System)
                                              </th>
                                              <th className="col-3">
                                                Item Date
                                              </th>
                                              <th className="col-3">
                                                Item Description
                                              </th>
                                              <th className="col-3 text-end">
                                                Item Price
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>{inActiveItemsGrid}</tbody>
                                        </table>
                                      </div>
                                    </div>
                                    <table className="table table-hover">
                                      <tbody>
                                        <td className="fw-bold fs-5 ps-3">
                                          Total Pricing
                                        </td>
                                        <td className="fw-bold fs-5 text-end pe-3">{`${new BigNumber(
                                          modal.tourInvoicePricing === ""
                                            ? "0"
                                            : modal.tourInvoicePricing
                                        ).toFixed(2, 0)} EUR`}</td>
                                      </tbody>
                                    </table>
                                  </div>
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
                                      <i className="fa-solid fa-ban"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Cancel Tour Invoice"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="cancelInvoice"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="tourInvoiceId"
                                      value={modal.tourInvoiceId}
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

                        {/* payment modal */}
                        <div
                          className="modal modal-adjuster fade payment-modal"
                          id="paymentModal"
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
                                    Customer Tour Invoice Management | Payments
                                    History
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.tourInvoiceId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="cancelModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="modal-content-container">
                                  <table className="table table-hover payment-table">
                                    <thead>
                                      <tr>
                                        <th>
                                          Transaction&nbsp;Reference&nbsp;Number
                                        </th>
                                        <th>Card Number</th>
                                        <th>Settlement Date</th>
                                        <th>Amount (EUR)</th>
                                        <th>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {modal.payments &&
                                      modal.payments.length > 0 ? (
                                        modal.payments.map((payment, index) => (
                                          <tr key={index}>
                                            <td>
                                              {payment.transactionReference ||
                                                "N/A"}
                                            </td>
                                            <td className="card-row">
                                              {payment.creditCardNumber}
                                              &nbsp;&nbsp;
                                              {payment.creditCardType ===
                                                "VISA" && (
                                                <img
                                                  src={visa}
                                                  alt="visa-card"
                                                />
                                              )}
                                              {payment.creditCardType ===
                                                "MASTERCARD" && (
                                                <img
                                                  src={master}
                                                  alt="master-card"
                                                />
                                              )}
                                              {payment.creditCardType ===
                                                "UNIONPAY" && (
                                                <img
                                                  src={union}
                                                  alt="union-card"
                                                />
                                              )}
                                              {payment.creditCardType ===
                                                "AMEX" && (
                                                <img
                                                  src={amex}
                                                  alt="amex-card"
                                                />
                                              )}
                                            </td>

                                            <td>
                                              {payment.settlementDate || "N/A"}
                                            </td>
                                            <td className="payment-amount">
                                              {payment.amount
                                                ? `${payment.amount} EUR`
                                                : "N/A"}
                                            </td>
                                            <td>
                                              {payment.success ? (
                                                <span className="payment-status-success">
                                                  Successful
                                                </span>
                                              ) : (
                                                <span className="payment-status-failed">
                                                  Failed
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan="5"
                                            className="text-center payment-message"
                                          >
                                            No payments have been made.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add customer */}
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
                                    Customer Tour Invoices Management | Add
                                    Customer
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="addCustomerModalClose"
                                  className="btn-close"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addInvoiceModal"
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
                                        value={customerModal.customerName}
                                        onChange={(event) => {
                                          setCustomerModal((prevModal) => {
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
                                      {errors.customer?.customerName &&
                                        errors.customer.customerName.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.customer.customerName[0]
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
                                        value={customerModal.customerEmail}
                                        onChange={(event) => {
                                          setCustomerModal((prevModal) => {
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
                                      {errors.customer?.customerEmail &&
                                        errors.customer.customerEmail.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.customer.customerEmail[0]
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
                                          value={customerModal.countryCode}
                                          onChange={(event) => {
                                            const newCountryCode =
                                              event.target.value;
                                            setCustomerModal((prevModal) => ({
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
                                          value={customerModal.customerPhone}
                                          onChange={(event) => {
                                            const newPhone =
                                              validatePhoneNumber(
                                                validateInputText(
                                                  event.target.value
                                                )
                                              );
                                            setCustomerModal((prevModal) => ({
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
                                      {errors.customer?.customerPhone &&
                                        errors.customer.customerPhone.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.customer.customerPhone[0]
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

                        {/* Add item */}
                        <div
                          className="modal modal-adjuster fade"
                          id="additem"
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
                                    Customer Tour Invoices Management | Add Tour
                                    Item
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="addItemModalClose"
                                  className="btn-close"
                                  data-bs-toggle="modal"
                                  data-bs-target={`#${itemModal.caller}`}
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <br />
                                <div className="row">
                                  <div className="col col-lg-4 col-md-6 col-12 mb-3">
                                    <label
                                      htmlFor="itemDate"
                                      className="form-label fw-bold"
                                    >
                                      Item Date
                                    </label>
                                    <input
                                      id="itemDate"
                                      type="date"
                                      className="form-control form-input-mod"
                                      value={itemModal.itemDate}
                                      onChange={(event) => {
                                        setItemModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            itemDate: event.target.value,
                                          };
                                        });
                                      }}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="itemDescription"
                                      className="form-label fw-bold"
                                    >
                                      Item Description
                                    </label>
                                    <input
                                      id="itemDescription"
                                      type="text"
                                      className="form-control form-input-mod"
                                      value={itemModal.itemDescription}
                                      onChange={(event) => {
                                        setItemModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            itemDescription:
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
                                  </div>
                                </div>
                                <div className="row mb-3">
                                  <label
                                    htmlFor="pricing"
                                    className="form-label fw-bold"
                                  >
                                    Item Price
                                  </label>
                                  <div className="input-group">
                                    <input
                                      type="number"
                                      className="form-control form-input-mod"
                                      id="pricing"
                                      min="0.00"
                                      step="0.01"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={itemModal.itemPrice || 0}
                                      onChange={(event) => {
                                        setItemModal((prev) => {
                                          return {
                                            ...prev,
                                            itemPrice: event.target.value || 0,
                                          };
                                        });
                                      }}
                                    />

                                    <span
                                      className="input-group-text input-group-text-mod form-input-mod fw-bold"
                                      id="basic-addon2"
                                    >
                                      EUR
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="button"
                                    className="btn btn-theme btn-sm"
                                    data-bs-toggle="modal"
                                    data-bs-target={`#${itemModal.caller}`}
                                    disabled={
                                      navigation.state === "submitting" ||
                                      !itemModal.itemDate ||
                                      !itemModal.itemDescription ||
                                      new BigNumber(
                                        itemModal.itemPrice
                                      ).isLessThan(new BigNumber("0"))
                                    }
                                    onClick={() => {
                                      const newItems = JSON.parse(
                                        JSON.stringify(modal.items)
                                      );
                                      newItems.push({
                                        keyVal: "",
                                        index: -1,
                                        caller: "",
                                        itemId: "--",
                                        itemDate: itemModal.itemDate,
                                        itemDescription:
                                          itemModal.itemDescription,
                                        itemPrice: itemModal.itemPrice,
                                      });
                                      setModal((prev) => {
                                        return {
                                          ...prev,
                                          tourInvoicePricing: new BigNumber(
                                            prev.tourInvoicePricing === ""
                                              ? "0"
                                              : prev.tourInvoicePricing
                                          )
                                            .plus(
                                              new BigNumber(itemModal.itemPrice)
                                            )
                                            .toFixed(2, 0),
                                          items: newItems,
                                        };
                                      });
                                    }}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Add Tour Item"}
                                    &nbsp;&nbsp;&nbsp;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Edit item */}
                        <div
                          className="modal modal-adjuster fade"
                          id="edititem"
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
                                    Customer Tour Invoices Management | Edit
                                    Tour Item
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="editItemModalClose"
                                  className="btn-close"
                                  data-bs-toggle="modal"
                                  data-bs-target={`#${itemModal.caller}`}
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <br />
                                <div className="row">
                                  <div className="col col-lg-4 col-md-6 col-12 mb-3">
                                    <label
                                      htmlFor="itemDate"
                                      className="form-label fw-bold"
                                    >
                                      Item Date
                                    </label>
                                    <input
                                      id="itemDate"
                                      type="date"
                                      className="form-control form-input-mod"
                                      value={itemModal.itemDate}
                                      onChange={(event) => {
                                        setItemModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            itemDate: event.target.value,
                                          };
                                        });
                                      }}
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  <div className="col mb-3">
                                    <label
                                      htmlFor="itemDescription"
                                      className="form-label fw-bold"
                                    >
                                      Item Description
                                    </label>
                                    <input
                                      id="itemDescription"
                                      type="text"
                                      className="form-control form-input-mod"
                                      value={itemModal.itemDescription}
                                      onChange={(event) => {
                                        setItemModal((prevModal) => {
                                          return {
                                            ...prevModal,
                                            itemDescription:
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
                                  </div>
                                </div>
                                <div className="row mb-3">
                                  <label
                                    htmlFor="pricing"
                                    className="form-label fw-bold"
                                  >
                                    Item Price
                                  </label>
                                  <div className="input-group">
                                    <input
                                      type="number"
                                      className="form-control form-input-mod"
                                      id="pricing"
                                      min="0.00"
                                      step="0.01"
                                      disabled={
                                        navigation.state === "submitting"
                                      }
                                      value={itemModal.itemPrice || 0}
                                      onChange={(event) => {
                                        setItemModal((prev) => {
                                          return {
                                            ...prev,
                                            itemPrice: event.target.value || 0,
                                          };
                                        });
                                      }}
                                    />

                                    <span
                                      className="input-group-text input-group-text-mod form-input-mod fw-bold"
                                      id="basic-addon2"
                                    >
                                      EUR
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="modal-footer grn-footer">
                                <div className="col text-end add-btn pe-2">
                                  <button
                                    type="button"
                                    className="btn btn-theme btn-sm"
                                    data-bs-toggle="modal"
                                    data-bs-target={`#${itemModal.caller}`}
                                    disabled={
                                      navigation.state === "submitting" ||
                                      !itemModal.itemDate ||
                                      !itemModal.itemDescription ||
                                      new BigNumber(
                                        itemModal.itemPrice
                                      ).isLessThan(new BigNumber("0"))
                                    }
                                    onClick={() => {
                                      const newItems = JSON.parse(
                                        JSON.stringify(modal.items)
                                      );
                                      newItems.splice(itemModal.index, 1, {
                                        keyVal: "",
                                        index: -1,
                                        caller: "",
                                        itemId: itemModal.itemId,
                                        itemDate: itemModal.itemDate,
                                        itemDescription:
                                          itemModal.itemDescription,
                                        itemPrice: itemModal.itemPrice,
                                      });
                                      setModal((prev) => {
                                        return {
                                          ...prev,
                                          tourInvoicePricing: new BigNumber(
                                            prev.tourInvoicePricing === ""
                                              ? "0"
                                              : prev.tourInvoicePricing
                                          )
                                            .minus(
                                              new BigNumber(
                                                modal.items[
                                                  itemModal.index
                                                ].itemPrice
                                              )
                                            )
                                            .plus(
                                              new BigNumber(itemModal.itemPrice)
                                            )
                                            .toFixed(2, 0),
                                          items: newItems,
                                        };
                                      });
                                    }}
                                  >
                                    &nbsp;
                                    <i className="fa-sharp fa-solid fa-pen"></i>
                                    &nbsp;&nbsp;{" "}
                                    {navigation.state === "submitting"
                                      ? "Submitting..."
                                      : "Edit Tour Item"}
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
