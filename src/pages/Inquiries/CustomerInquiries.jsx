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
  searchTourInquiries,
  declineTourInquiry,
  approveTourInquiry,
  invoiceTourInquiry,
} from "../../api/Inquiries/CustomerInquiries";
import ServerMessageToast from "../../components/ServerMessageToast";
import {
  validateInputText,
  validateInputTextNoUpperCase,
} from "../../utils/StringUtils";
import FullscreenThrobber from "../../components/throbbers/FullscreenThrobber";
import BigNumber from "bignumber.js";
import CustomQuillEditor from "../../components/CustomQuillEditor";
import DOMPurify from "dompurify";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "tourInquiryId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const filterValue = url.searchParams.get("filterValue") || "all";
  const tourInquiriesDataAPI = await searchTourInquiries(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const tourInquiriesData = { authentication, tourInquiriesDataAPI };
  return defer(tourInquiriesData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

  if (formType === "declineInquiry") {
    const tourInquiryId = formData.get("tourInquiryId");
    const batchNo = formData.get("batchNo");
    if (tourInquiryId === null || tourInquiryId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let deleteTourInquiryResponse = await declineTourInquiry(
      tourInquiryId,
      batchNo
    );
    if (deleteTourInquiryResponse !== null) {
      deleteTourInquiryResponse = {
        ...deleteTourInquiryResponse,
        formType: formType,
      };
      return deleteTourInquiryResponse;
    }
  }

  if (formType === "approveInquiry") {
    const tourInquiryId = formData.get("tourInquiryId");
    const batchNo = formData.get("batchNo");
    if (tourInquiryId === null || tourInquiryId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let approveTourInquiryResponse = await approveTourInquiry(
      tourInquiryId,
      batchNo
    );
    if (approveTourInquiryResponse !== null) {
      approveTourInquiryResponse = {
        ...approveTourInquiryResponse,
        formType: formType,
      };
      return approveTourInquiryResponse;
    }
  }

  if (formType === "invoiceInquiry") {
    const tourInquiryId = formData.get("tourInquiryId");
    const batchNo = formData.get("batchNo");
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
    if (tourInquiryId === null || tourInquiryId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
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
      let addTourInvoiceResponse = await invoiceTourInquiry(
        tourInquiryId,
        batchNo,
        tourInvoiceTitle,
        tourInvoiceDescription,
        newItemsArr
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

  return null;
}

export default function CustomerInquiries() {
  const { tourInquiriesDataAPI, authentication } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const response = useActionData();
  const navigation = useNavigation();
  const [searchForm, setSearchForm] = useState({});
  const searchFormSubmitRef = useRef(null);
  const tourInquiryIdRef = useRef(null);

  const [showEditDetails, setShowEditDetails] = useState(false);
  const toggleDetails = () => {
    setShowEditDetails((prev) => !prev);
  };

  const [modal, setModal] = useState({
    tourPackageId: "",
    tourPackageTitle: "",
    tourPackageDescription: "",
    tourPackageBudget: "",
    tourInquiryStatusId: "",
    tourInvoice: null,
    customer: {
      customerId: "",
      customerName: "",
      customerPhone: "",
    },
    batchNo: "",
    created: "",
    createdBy: "",
    lastModified: "",
    lastModifiedBy: "",
    tourInquiryId: "",
    tourInquiryDate: "",
    noOfAdults: "",
    noOfChildren: "",
    noOfInfants: "",
    noOfRooms: "",
    travelDate: "",
    departureDate: "",
    tourInvoiceTitle: "",
    tourInvoiceDescription: "",
    tourInvoicePricing: "",
    items: [],
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

  const [errors, setErrors] = useState({
    add: {
      tourInvoiceTitle: null,
      tourInvoiceDescription: null,
      tourInvoicePricing: null,
    },
  });

  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tempVal, setTempVal] = useState();
  const [valSwitch, setValSwitch] = useState(false);

  useEffect(() => {
    setSearchForm(() => {
      return {
        searchBy: searchParams.get("searchBy") || "tourInquiryId",
        searchValue: searchParams.get("searchValue") || "",
        sortType: searchParams.get("sortType") || "created",
        sortOrder: searchParams.get("sortOrder") || "desc",
        page: searchParams.get("page") || "1",
        filterValue: searchParams.get("filterValue") || "all",
      };
    });
  }, [searchParams]);

  function clearModalData() {
    setTempVal(() => "");
    setValSwitch(() => !valSwitch);
    setModal({
      tourPackageId: "",
      tourPackageTitle: "",
      tourPackageDescription: "",
      tourPackageBudget: "",
      tourInquiryStatusId: "",
      tourInvoice: null,
      customer: {
        customerId: "",
        customerName: "",
        customerPhone: "",
      },
      batchNo: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      tourInquiryId: "",
      tourInquiryDate: "",
      noOfAdults: "",
      noOfChildren: "",
      noOfInfants: "",
      noOfRooms: "",
      travelDate: "",
      departureDate: "",
      tourInvoiceTitle: "",
      tourInvoiceDescription: "",
      tourInvoicePricing: "",
      items: [],
    });
    setErrors(() => {
      return {
        add: {
          tourInvoiceTitle: null,
          tourInvoiceDescription: null,
          tourInvoicePricing: null,
        },
      };
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
                <Await resolve={tourInquiriesDataAPI}>
                  {({ data }) => {
                    const { pagination, objects, tourPackages } = data;
                    const priceTiers = [];
                    const datagrid = objects.map((tourInquiry) => {
                      return (
                        <tr key={tourInquiry.tourInquiryId}>
                          <td className="text-truncate">
                            {tourInquiry.tourInquiryId}
                          </td>
                          <td className="text-truncate">
                            {tourInquiry.tourInquiryDate}
                          </td>
                          <td className="text-truncate">
                            {tourInquiry.customer.customerName}
                          </td>
                          <td className="text-truncate inquiry-status-col">
                            {(() => {
                              const statusMap = {
                                "PE-1": {
                                  className: "inquiry inquiry-pending",
                                  text: "PENDING",
                                },
                                "PE-2": {
                                  className: "inquiry inquiry-approved",
                                  text: "APPROVED",
                                },
                                "PE-3": {
                                  className: "inquiry inquiry-rejected",
                                  text: "DECLINED",
                                },
                                "PE-4": {
                                  className: "inquiry inquiry-invoiced",
                                  text: "INVOICED",
                                },
                              };

                              const status =
                                statusMap[tourInquiry.tourInquiryStatusId];

                              return status ? (
                                <span className={status.className}>
                                  {status.text}
                                </span>
                              ) : null;
                            })()}
                          </td>
                          <td className="text-truncate inquiry-status-col">
                            {tourInquiry.tourPackageId === "PE-999" ? (
                              <>
                                <span className="inquiry inquiry-budget">
                                  BUDGET
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inquiry inquiry-general">
                                  GENERAL
                                </span>
                              </>
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
                                  disabled={!tourInquiry.authorities.view}
                                  value={tourInquiry.tourInquiryId}
                                  onClick={() =>
                                    loadModalData(tourInquiry.tourInquiryId)
                                  }
                                >
                                  <i className="fa-sharp fa-solid fa-eye"></i>
                                </button>
                              </div>
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="Approve"
                                  data-bs-toggle="modal"
                                  data-bs-target="#approveInquiryModal"
                                  disabled={!tourInquiry.authorities.approve}
                                  value={tourInquiry.tourInquiryId}
                                  onClick={() =>
                                    loadModalData(tourInquiry.tourInquiryId)
                                  }
                                >
                                  <i className="fa-solid fa-thumbs-up"></i>
                                </button>
                              </div>
                              <div className="col col-3">
                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  title="Decline"
                                  data-bs-toggle="modal"
                                  data-bs-target="#declineInquiryModal"
                                  disabled={!tourInquiry.authorities.decline}
                                  value={tourInquiry.tourInquiryId}
                                  onClick={() =>
                                    loadModalData(tourInquiry.tourInquiryId)
                                  }
                                >
                                  <i className="fa-solid fa-thumbs-down"></i>
                                </button>
                              </div>
                              <div className="col col-3">
                                <button
                                  type="button"
                                  id={`${tourInquiry.tourInquiryId}`}
                                  className="action-btn delete-btn"
                                  title="Invoice"
                                  data-bs-toggle="modal"
                                  data-bs-target="#invoiceInquiryModal"
                                  disabled={!tourInquiry.authorities.invoice}
                                  value={tourInquiry.tourInquiryId}
                                  onClick={() =>
                                    loadModalData(tourInquiry.tourInquiryId)
                                  }
                                >
                                  <i className="fa-solid fa-file-invoice-dollar"></i>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    });

                    useEffect(() => {
                      setErrors(() => {
                        return {
                          add: {
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
                        };
                      });
                      if (
                        response !== undefined &&
                        response !== null &&
                        response.message !== undefined
                      ) {
                        if (
                          response.formType === "declineInquiry" &&
                          response.message.success
                        ) {
                          document.getElementById("declineModalClose").click();
                          setTimeout(function () {
                            clearModalData();
                          }, 500);
                        }

                        if (
                          response.formType === "invoiceInquiry" &&
                          response.message.success
                        ) {
                          document.getElementById("invoiceModalClose").click();
                          setTimeout(function () {
                            clearModalData();
                          }, 500);
                        }

                        if (
                          response.formType === "approveInquiry" &&
                          response.message.success
                        ) {
                          tourInquiryIdRef.current = modal.tourInquiryId;
                          setLoading(() => true);
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
                      if (tourInquiryIdRef.current !== null) {
                        loadModalData(tourInquiryIdRef.current);
                        setTimeout(function () {
                          document.getElementById("approveModalClose").click();
                          document
                            .getElementById(tourInquiryIdRef.current)
                            .click();
                          tourInquiryIdRef.current = null;
                          setLoading(() => false);
                        }, 500);
                      }
                    }, [tourInquiriesDataAPI]);

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

                    function loadModalData(tourInquiryId) {
                      const tourInquiry = objects.filter(
                        (tourInquiry) =>
                          tourInquiry.tourInquiryId === tourInquiryId
                      )[0];

                      setTempVal(() => tourInquiry.tourPackageDescription);
                      setValSwitch(() => !valSwitch);
                      setModal(() => {
                        return {
                          tourPackageId: tourInquiry.tourPackageId,
                          tourPackageTitle: tourInquiry.tourPackageTitle,
                          tourPackageDescription:
                            tourInquiry.tourPackageDescription,
                          tourPackageBudget: tourInquiry.tourPackageBudget,
                          tourInquiryStatusId: tourInquiry.tourInquiryStatusId,
                          tourInvoice: tourInquiry.tourInvoice,
                          customer: {
                            customerId: tourInquiry.customer.customerId,
                            customerName: tourInquiry.customer.customerName,
                            customerPhone: tourInquiry.customer.customerPhone,
                          },
                          batchNo: tourInquiry.batchNo,
                          created: tourInquiry.created,
                          createdBy: tourInquiry.createdBy,
                          lastModified: tourInquiry.lastModified,
                          lastModifiedBy: tourInquiry.lastModifiedBy,
                          tourInquiryId: tourInquiry.tourInquiryId,
                          tourInquiryDate: tourInquiry.tourInquiryDate,
                          noOfAdults: tourInquiry.noOfAdults,
                          noOfChildren: tourInquiry.noOfChildren,
                          noOfInfants: tourInquiry.noOfInfants,
                          noOfRooms: tourInquiry.noOfRooms,
                          travelDate: tourInquiry.travelDate,
                          departureDate: tourInquiry.departureDate,
                          tourInvoiceTitle: tourInquiry.tourPackageTitle,
                          tourInvoiceDescription:
                            tourInquiry.tourPackageDescription,
                          tourInvoicePricing: "",
                          items: [],
                        };
                      });
                      setErrors(() => {
                        return {
                          add: {
                            tourInvoiceTitle: null,
                            tourInvoiceDescription: null,
                            tourInvoicePricing: null,
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
                        {loading ? <FullscreenThrobber /> : <></>}

                        <section>
                          <div className="content">
                            <div className="container">
                              <div className="row pt-3 mb-3 align-items-center user-content">
                                <div className="col title-grn">
                                  <h4 className="page-header user-heading">
                                    Customer Tour Inquiries Management
                                  </h4>
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
                                        <option value="PE-1">PENDING</option>
                                        <option value="PE-2">APPROVED</option>
                                        <option value="PE-3">DECLINED</option>
                                        <option value="PE-4">INVOICED</option>
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
                                        <option value="tourInquiryId">
                                          Tour&nbsp;Inquiry&nbsp;ID
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
                                              Tour&nbsp;Inquiry&nbsp;ID
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
                                                        "tourInquiryId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInquiryId",
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
                                                    "tourInquiryId"
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
                                              Tour&nbsp;Inquiry&nbsp;Date
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
                                                        "tourInquiryDate"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInquiryDate",
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
                                                    "tourInquiryDate"
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
                                                        "tourInquiryStatusId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "tourInquiryStatusId",
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
                                                    "tourInquiryStatusId"
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
                                              Type
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
                                    Customer Tour Inquiries Management | View
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Inquiry ID:{" "}
                                    </span>
                                    {modal.tourInquiryId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customer.customerName}
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
                                {modal.tourInquiryStatusId === "PE-1" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text active">
                                        PENDING
                                      </div>
                                      <div className="counter active">1</div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text">
                                        APPROVE&nbsp;/&nbsp;DECLINE
                                      </div>
                                      <div className="counter">2</div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text">
                                        INVOICE
                                      </div>
                                      <div className="counter">3</div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInquiryStatusId === "PE-2" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        PENDING
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        APPROVED
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text active">
                                        INVOICE
                                      </div>
                                      <div className="counter active">3</div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInquiryStatusId === "PE-3" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        PENDING
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text decline">
                                        DECLINED
                                      </div>
                                      <div className="counter decline">
                                        <i className="fa-solid fa-xmark"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text">
                                        INVOICE
                                      </div>
                                      <div className="counter">3</div>
                                    </div>
                                  </div>
                                )}
                                {modal.tourInquiryStatusId === "PE-4" && (
                                  <div className="step-counter-container">
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        PENDING
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        APPROVED
                                      </div>
                                      <div className="counter done">
                                        <i className="fa-solid fa-check"></i>
                                      </div>
                                    </div>
                                    <div className="step-counter">
                                      <div className="counter-text done">
                                        INVOICE
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
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Type
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourPackageId === "PE-999" ? (
                                          <>
                                            <span className="inquiry inquiry-budget">
                                              BUDGET
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="inquiry inquiry-general">
                                              GENERAL
                                            </span>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customer.customerName}
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
                                        {modal.customer.customerPhone}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Adults
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfAdults}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Children
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfChildren}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Infants
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfInfants}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Number of Rooms
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.noOfRooms}
                                        </td>
                                      </tr>
                                    )}
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Tour Package
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.tourPackageTitle}
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Travel Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.travelDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Departure Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.departureDate}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Travel Budget
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {`${new BigNumber(
                                            modal.tourPackageBudget
                                          ).toFixed(2, 0)} EUR`}
                                        </td>
                                      </tr>
                                    ) : (
                                      <></>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Inquiry Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {(() => {
                                          const statusMap = {
                                            "PE-1": {
                                              className:
                                                "inquiry inquiry-pending",

                                              text: "PENDING",
                                            },
                                            "PE-2": {
                                              className:
                                                "inquiry inquiry-approved",

                                              text: "APPROVED",
                                            },

                                            "PE-3": {
                                              className:
                                                "inquiry inquiry-rejected",

                                              text: "DECLINED",
                                            },
                                            "PE-4": {
                                              className:
                                                "inquiry inquiry-invoiced",

                                              text: "INVOICED",
                                            },
                                          };

                                          const status =
                                            statusMap[
                                              modal.tourInquiryStatusId
                                            ];

                                          return status ? (
                                            <span className={status.className}>
                                              {status.text}
                                            </span>
                                          ) : null;
                                        })()}
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
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Approve Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="approveInquiryModal"
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
                                    Customer Tour Inquiries Management | Approve
                                    Inquiry
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Inquiry ID:{" "}
                                    </span>
                                    {modal.tourInquiryId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customer.customerName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="approveModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={
                                    navigation.state === "submitting" ||
                                    navigation.state === "loading"
                                  }
                                ></button>
                              </div>
                              <div className="modal-body">
                                <div className="step-counter-container">
                                  <div className="step-counter">
                                    <div className="counter-text done">
                                      PENDING
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                      APPROVE&nbsp;/&nbsp;DECLINE
                                    </div>
                                    <div className="counter active">2</div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text">INVOICE</div>
                                    <div className="counter">3</div>
                                  </div>
                                </div>
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Type
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourPackageId === "PE-999" ? (
                                          <>
                                            <span className="inquiry inquiry-budget">
                                              BUDGET
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="inquiry inquiry-general">
                                              GENERAL
                                            </span>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customer.customerName}
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
                                        {modal.customer.customerPhone}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Adults
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfAdults}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Children
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfChildren}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Infants
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfInfants}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Number of Rooms
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.noOfRooms}
                                        </td>
                                      </tr>
                                    )}
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Tour Package
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.tourPackageTitle}
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Travel Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.travelDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Departure Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.departureDate}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Travel Budget
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {`${new BigNumber(
                                            modal.tourPackageBudget
                                          ).toFixed(2, 0)} EUR`}
                                        </td>
                                      </tr>
                                    ) : (
                                      <></>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Inquiry Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {(() => {
                                          const statusMap = {
                                            "PE-1": {
                                              className:
                                                "inquiry inquiry-pending",

                                              text: "PENDING",
                                            },
                                            "PE-2": {
                                              className:
                                                "inquiry inquiry-approved",

                                              text: "APPROVED",
                                            },

                                            "PE-3": {
                                              className:
                                                "inquiry inquiry-rejected",

                                              text: "DECLINED",
                                            },
                                            "PE-4": {
                                              className:
                                                "inquiry inquiry-invoiced",

                                              text: "INVOICED",
                                            },
                                          };

                                          const status =
                                            statusMap[
                                              modal.tourInquiryStatusId
                                            ];

                                          return status ? (
                                            <span className={status.className}>
                                              {status.text}
                                            </span>
                                          ) : null;
                                        })()}
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
                                )}
                              </div>
                              <div className="modal-footer">
                                <div className="col text-end add-btn pe-2">
                                  <Form method="post">
                                    <button
                                      type="submit"
                                      className="btn btn-theme btn-sm"
                                      disabled={
                                        navigation.state === "submitting" ||
                                        navigation.state === "loading"
                                      }
                                    >
                                      &nbsp;
                                      <i className="fa-solid fa-thumbs-up"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Approve Inquiry"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="approveInquiry"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="tourInquiryId"
                                      value={modal.tourInquiryId}
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

                        {/* Decline Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="declineInquiryModal"
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
                                    Customer Tour Inquiries Management | Decline
                                    Inquiry
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Inquiry ID:{" "}
                                    </span>
                                    {modal.tourInquiryId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customer.customerName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="declineModalClose"
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
                                      PENDING
                                    </div>
                                    <div className="counter done">
                                      <i className="fa-solid fa-check"></i>
                                    </div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text active">
                                      APPROVE&nbsp;/&nbsp;DECLINE
                                    </div>
                                    <div className="counter active">2</div>
                                  </div>
                                  <div className="step-counter">
                                    <div className="counter-text">INVOICE</div>
                                    <div className="counter">3</div>
                                  </div>
                                </div>
                                <table className="table table-hover">
                                  <tbody>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry ID
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryId}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourInquiryDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Tour Inquiry Type
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.tourPackageId === "PE-999" ? (
                                          <>
                                            <span className="inquiry inquiry-budget">
                                              BUDGET
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="inquiry inquiry-general">
                                              GENERAL
                                            </span>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Customer
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.customer.customerName}
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
                                        {modal.customer.customerPhone}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Adults
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfAdults}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Children
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfChildren}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Number of Infants
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.noOfInfants}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Number of Rooms
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.noOfRooms}
                                        </td>
                                      </tr>
                                    )}
                                    {modal.tourPackageId === "PE-999" ? (
                                      <></>
                                    ) : (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Tour Package
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {modal.tourPackageTitle}
                                        </td>
                                      </tr>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Travel Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.travelDate}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Departure Date
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.departureDate}
                                      </td>
                                    </tr>
                                    {modal.tourPackageId === "PE-999" ? (
                                      <tr>
                                        <th scope="row">
                                          <div className="row table-heading align-items-center">
                                            <div className="col table-heading-title">
                                              Travel Budget
                                            </div>
                                          </div>
                                        </th>
                                        <td className="text-truncate align-middle">
                                          {`${new BigNumber(
                                            modal.tourPackageBudget
                                          ).toFixed(2, 0)} EUR`}
                                        </td>
                                      </tr>
                                    ) : (
                                      <></>
                                    )}
                                    <tr>
                                      <th scope="row">
                                        <div className="row table-heading align-items-center">
                                          <div className="col table-heading-title">
                                            Inquiry Status
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {(() => {
                                          const statusMap = {
                                            "PE-1": {
                                              className:
                                                "inquiry inquiry-pending",

                                              text: "PENDING",
                                            },
                                            "PE-2": {
                                              className:
                                                "inquiry inquiry-approved",

                                              text: "APPROVED",
                                            },

                                            "PE-3": {
                                              className:
                                                "inquiry inquiry-rejected",

                                              text: "DECLINED",
                                            },
                                            "PE-4": {
                                              className:
                                                "inquiry inquiry-invoiced",

                                              text: "INVOICED",
                                            },
                                          };

                                          const status =
                                            statusMap[
                                              modal.tourInquiryStatusId
                                            ];

                                          return status ? (
                                            <span className={status.className}>
                                              {status.text}
                                            </span>
                                          ) : null;
                                        })()}
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
                                )}
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
                                      <i className="fa-solid fa-thumbs-down"></i>
                                      &nbsp;&nbsp;{" "}
                                      {navigation.state === "submitting"
                                        ? "Submitting..."
                                        : "Decline Inquiry"}
                                      &nbsp;&nbsp;&nbsp;
                                    </button>
                                    <input
                                      type="hidden"
                                      name="formType"
                                      value="declineInquiry"
                                      readOnly={true}
                                    />
                                    <input
                                      type="hidden"
                                      name="tourInquiryId"
                                      value={modal.tourInquiryId}
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

                        {/* Invoice Modal */}
                        <div
                          className="modal modal-adjuster fade"
                          id="invoiceInquiryModal"
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
                                    Customer Tour Inquiries Management | Invoice
                                    Inquiry
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Inquiry ID:{" "}
                                    </span>
                                    {modal.tourInquiryId}
                                    <br />
                                    <span className="fw-bold">
                                      Customer Name:{" "}
                                    </span>
                                    {modal.customer.customerName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  id="invoiceModalClose"
                                  className="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                  disabled={navigation.state === "submitting"}
                                ></button>
                              </div>
                              <div className="modal-body grn-body">
                                <Form id="addForm" method="post">
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
                                                caller: "invoiceInquiryModal",
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
                                                "invoiceInquiryModal"
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
                                    value="invoiceInquiry"
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="items"
                                    value={JSON.stringify(modal.items)}
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
                                    name="tourInquiryId"
                                    value={modal.tourInquiryId}
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
                                    Customer Tour Inquiries Management | Add
                                    Tour Item
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
                                    Customer Tour Inquiries Management | Edit
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
