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
  searchAgentInvoices,
  addAgentInvoice,
  deleteAgentInvoice,
  editAgentInvoice,
  postAgentInvoice,
  directDepositAgentInvoices,
  cancelAgentInvoice,
  printAgentInvoice,
} from "../../api/invoicing/AgentInvoices";
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
import { searchAgents, addAgent } from "../../api/administration/agents";
import BigNumber from "bignumber.js";
import CustomQuillEditor from "../../components/CustomQuillEditor";
import DOMPurify from "dompurify";
import Dropzone, { useDropzone } from "react-dropzone";

export async function loader({ request }) {
  const url = new URL(request.url);
  const authentication = requireAuth();
  const searchBy = url.searchParams.get("searchBy") || "agentTourInvoiceId";
  const searchValue = url.searchParams.get("searchValue") || "";
  const page = url.searchParams.get("page") || "1";
  const sortType = url.searchParams.get("sortType") || "created";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";
  const filterValue = url.searchParams.get("filterValue") || "all";
  const agentInvoicesDataAPI = await searchAgentInvoices(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const agentDataAPI = await searchAgents(
    searchBy,
    searchValue,
    page,
    sortType,
    sortOrder,
    filterValue
  );

  const agentInvoicesData = {
    authentication,
    agentInvoicesDataAPI,
    agentDataAPI,
  };
  return defer(agentInvoicesData);
}

export async function action({ request }) {
  const formData = await request.formData();
  const formType = formData.get("formType");
  const inputRegex = /^[a-zA-Z0-9äöüÄÖÜß\s!@#$%^*()_+={}\[\]:;,.?\/\\|\-]+$/;

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
    console.log(
      agentName,
      agentEmail,
      agentPhone,
      agentAddress,
      agentBusinessRegistrationNo,
      agentBusinessRegistrationFile,
      newsLetter
    );
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let response = { errors: [] };
    if (!agentName || agentName === "" || !inputRegex.test(agentName)) {
      response.errors.push({
        name: "agentAgentName",
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
        name: "agentAgentEmail",
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
        name: "agentAgentPhone",
        message: "Please enter a valid Agent phone number.",
      });
    }

    if (
      agentAddress === null ||
      agentAddress === "" ||
      !inputRegex.test(agentAddress)
    ) {
      response.errors.push({
        name: "agentAgentAddress",
        message: "Please enter a valid Agent Address.",
      });
    }

    if (
      agentBusinessRegistrationNo === null ||
      agentBusinessRegistrationNo === "" ||
      !inputRegex.test(agentBusinessRegistrationNo)
    ) {
      response.errors.push({
        name: "agentBusinessRegistrationNo",
        message: "Please enter a valid Business Registration Number.",
      });
    }

    if (
      !agentBusinessRegistrationFile ||
      agentBusinessRegistrationFile.size === 0
    ) {
      response.errors.push({
        name: "agentBusinessRegistrationFile",
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

  if (formType === "addInvoice") {
    const agentId = formData.get("agentId");
    const items = JSON.parse(formData.get("items"));
    const agentTourInvoiceTitle = formData.get("tourInvoiceTitle");
    let agentTourInvoiceDescription = formData.get("tourInvoiceDescription");
    agentTourInvoiceDescription = DOMPurify.sanitize(
      agentTourInvoiceDescription,
      {
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
      }
    );
    let response = { errors: [] };
    if (agentId === null || agentId === "") {
      response.errors.push({
        name: "addAgent",
        message: "Please select a agent from the given list.",
      });
    }
    if (
      agentTourInvoiceTitle === null ||
      agentTourInvoiceTitle === "" ||
      !inputRegex.test(agentTourInvoiceTitle)
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
      let addAgentInvoiceResponse = await addAgentInvoice(
        agentTourInvoiceTitle,
        agentTourInvoiceDescription,
        newItemsArr,
        agentId
      );
      if (addAgentInvoiceResponse !== null) {
        addAgentInvoiceResponse = {
          ...addAgentInvoiceResponse,
          formType: formType,
        };
        return addAgentInvoiceResponse;
      }
    }
  }

  if (formType === "deleteInvoice") {
    const agentTourInvoiceId = formData.get("agentTourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (agentTourInvoiceId === null || agentTourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let deleteAgentInvoiceResponse = await deleteAgentInvoice(
      agentTourInvoiceId,
      batchNo
    );
    if (deleteAgentInvoiceResponse !== null) {
      deleteAgentInvoiceResponse = {
        ...deleteAgentInvoiceResponse,
        formType: formType,
      };
      return deleteAgentInvoiceResponse;
    }
  }

  if (formType === "editInvoice") {
    const items = JSON.parse(formData.get("items"));
    const batchNo = formData.get("batchNo");
    const agentTourInvoiceId = formData.get("agentTourInvoiceId");
    const agentTourInvoiceTitle = formData.get("tourInvoiceTitle");
    let agentTourInvoiceDescription = formData.get("tourInvoiceDescription");
    agentTourInvoiceDescription = DOMPurify.sanitize(
      agentTourInvoiceDescription,
      {
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
      }
    );

    console.log(items);
    console.log(agentTourInvoiceDescription);
    console.log(agentTourInvoiceTitle);
    console.log(agentTourInvoiceId);
    console.log(batchNo);

    let response = { errors: [] };
    if (batchNo === null || batchNo === "") {
      return null;
    }
    if (agentTourInvoiceId === null || agentTourInvoiceId === "") {
      return null;
    }
    if (
      agentTourInvoiceTitle === null ||
      agentTourInvoiceTitle === "" ||
      !inputRegex.test(agentTourInvoiceTitle)
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
      let editAgentInvoiceResponse = await editAgentInvoice(
        agentTourInvoiceTitle,
        agentTourInvoiceDescription,
        agentTourInvoiceId,
        batchNo,
        newItemsArr
      );

      if (editAgentInvoiceResponse !== null) {
        editAgentInvoiceResponse = {
          ...editAgentInvoiceResponse,
          formType: formType,
        };
        return editAgentInvoiceResponse;
      }
    }
  }

  if (formType === "postInvoice") {
    const items = JSON.parse(formData.get("items"));
    const batchNo = formData.get("batchNo");
    const agentTourInvoiceId = formData.get("agentTourInvoiceId");
    const agentTourInvoiceTitle = formData.get("tourInvoiceTitle");
    let agentTourInvoiceDescription = formData.get("tourInvoiceDescription");
    agentTourInvoiceDescription = DOMPurify.sanitize(
      agentTourInvoiceDescription,
      {
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
      }
    );

    console.log(items);
    console.log(agentTourInvoiceDescription);
    console.log(agentTourInvoiceTitle);
    console.log(agentTourInvoiceId);
    console.log(batchNo);

    let response = { errors: [] };
    if (batchNo === null || batchNo === "") {
      return null;
    }
    if (agentTourInvoiceId === null || agentTourInvoiceId === "") {
      return null;
    }
    if (
      agentTourInvoiceTitle === null ||
      agentTourInvoiceTitle === "" ||
      !inputRegex.test(agentTourInvoiceTitle)
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
      let postAgentInvoiceResponse = await postAgentInvoice(
        agentTourInvoiceTitle,
        agentTourInvoiceDescription,
        agentTourInvoiceId,
        batchNo,
        newItemsArr
      );

      if (postAgentInvoiceResponse !== null) {
        postAgentInvoiceResponse = {
          ...postAgentInvoiceResponse,
          formType: formType,
        };
        return postAgentInvoiceResponse;
      }
    }
  }

  if (formType === "directDeposit") {
    const agentTourInvoiceId = formData.get("agentTourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (agentTourInvoiceId === null || agentTourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let directDepositAgentInvoiceResponse = await directDepositAgentInvoices(
      agentTourInvoiceId,
      batchNo
    );
    if (directDepositAgentInvoiceResponse !== null) {
      directDepositAgentInvoiceResponse = {
        ...directDepositAgentInvoiceResponse,
        formType: formType,
      };
      return directDepositAgentInvoiceResponse;
    }
  }

  if (formType === "cancelInvoice") {
    const agentTourInvoiceId = formData.get("agentTourInvoiceId");
    const batchNo = formData.get("batchNo");
    if (agentTourInvoiceId === null || agentTourInvoiceId === "") {
      return null;
    }
    if (batchNo === null || batchNo === "") {
      return null;
    }
    let cancelAgentInvoiceResponse = await cancelAgentInvoice(
      agentTourInvoiceId,
      batchNo
    );
    if (cancelAgentInvoiceResponse !== null) {
      cancelAgentInvoiceResponse = {
        ...cancelAgentInvoiceResponse,
        formType: formType,
      };
      return cancelAgentInvoiceResponse;
    }
  }

  if (formType === "printInvoice") {
    const agentTourInvoiceNumber = formData.get("agentTourInvoiceNumber");
    console.log(agentTourInvoiceNumber);
    if (agentTourInvoiceNumber === null || agentTourInvoiceNumber === "") {
      return null;
    }
    let responseBlob = await printAgentInvoice(agentTourInvoiceNumber);
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
  return null;
}

export default function AgentInvoices() {
  const { agentInvoicesDataAPI, agentDataAPI, authentication } =
    useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const response = useActionData();
  const navigation = useNavigation();
  const [searchForm, setSearchForm] = useState({});
  const searchFormSubmitRef = useRef(null);
  const [tempVal, setTempVal] = useState();
  const [valSwitch, setValSwitch] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const hiddenInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [errors, setErrors] = useState({
    add: {
      agentId: null,
      agentTourInvoiceTitle: null,
      agentTourInvoiceDescription: null,
      agentTourInvoicePricing: null,
    },
    edit: {
      agentTourInvoiceTitle: null,
      agentTourInvoiceDescription: null,
      agentTourInvoicePricing: null,
    },
    post: {
      agentTourInvoiceTitle: null,
      agentTourInvoiceDescription: null,
      agentTourInvoicePricing: null,
    },
    agent: {
      agentName: null,
      agentPhone: null,
      agentEmail: null,
      agentAddress: null,
      agentBusinessRegistrationNo: null,
      agentBusinessRegistrationFile: null,
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
    agentTourInvoiceId: "",
    agentTourInvoiceDate: "",
    agentTourInvoiceTitle: "",
    agentTourInvoiceDescription: "",
    agentTourInvoicePricing: "",
    items: [],
    agent: {
      authorities: "",
      batchNo: "",
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
      agentId: "",
      agentEmail: "",
      token: "",
      agentName: "",
      agentPhone: "",
      active: false,
    },
    tourInvoiceStatusId: "",
    payments: [],
  });

  const [agentModal, setAgentModal] = useState({
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
      agentId: "",
      agentName: "",
    },
    hidden: {
      created: "",
      createdBy: "",
      lastModified: "",
      lastModifiedBy: "",
    },
    batchNo: "",
    agentId: "",
    agentEmail: "",
    agentName: "",
    agentPhone: "",
    countryCode: "",
    token: "",
    agentAddress: "",
    agentBusinessRegistrationNo: "",
    agentBusinessRegistrationFile: "",
    newsLetter: true,
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
        searchBy: searchParams.get("searchBy") || "agentTourInvoiceId",
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
          agentId: response?.errors?.filter((o) => o.name === "addAgent"),
          agentTourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "addTitle"
          ),
          agentTourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "addDescription"
          ),
          agentTourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "addPricing"
          ),
        },
        edit: {
          agentTourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "editTitle"
          ),
          agentTourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "editDescription"
          ),
          agentTourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "editPricing"
          ),
        },
        post: {
          agentTourInvoiceTitle: response?.errors?.filter(
            (o) => o.name === "postTitle"
          ),
          agentTourInvoiceDescription: response?.errors?.filter(
            (o) => o.name === "postDescription"
          ),
          agentTourInvoicePricing: response?.errors?.filter(
            (o) => o.name === "postPricing"
          ),
        },
        agent: {
          agentName: response?.errors?.filter(
            (o) => o.name === "agentAgentName"
          ),
          agentEmail: response?.errors?.filter(
            (o) => o.name === "agentAgentEmail"
          ),
          agentPhone: response?.errors?.filter(
            (o) => o.name === "agentAgentPhone"
          ),
          agentAddress: response?.errors?.filter(
            (o) => o.name === "agentAgentAddress"
          ),
          agentBusinessRegistrationNo: response?.errors?.filter(
            (o) => o.name === "agentBusinessRegistrationNo"
          ),
          agentBusinessRegistrationFile: response?.errors?.filter(
            (o) => o.name === "agentBusinessRegistrationFile"
          ),
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

      if (response.formType === "addAgent" && response.message.success) {
        document.getElementById("addAgentModalClose").click();
        setTimeout(function () {
          setModal((prev) => {
            return {
              ...prev,
              agent: {
                ...modal.agent,
                agentId: response.data,
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

  const [agentsState, setAgentsState] = useState([]);

  useEffect(() => {
    const combinedPhone = `${agentModal.countryCode}${agentModal.agentPhone}`;

    const isDuplicate = agentDataAPI.data.objects.some(
      (agent) => agent.agentPhone === combinedPhone
    );

    setPhoneWarning(
      isDuplicate ? "This phone number is already in use." : null
    );
  }, [agentModal.countryCode, agentModal.agentPhone]);

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
                <Await resolve={agentInvoicesDataAPI}>
                  {({ data }) => {
                    const {
                      authorities,
                      pagination,
                      objects,
                      agents,
                      tourInvoiceStatuses,
                    } = data;

                    useEffect(() => {
                      const newAgents = agents.map((x) => x);
                      setAgentsState(() => {
                        return newAgents;
                      });
                    }, [agentInvoicesDataAPI]);

                    const datagrid = objects.map((agentInvoice) => {
                      return (
                        <tr
                          key={agentInvoice.agentTourInvoiceId}
                          className="table-row-invoice"
                        >
                          <td className="text-truncate double-row">
                            {agentInvoice.agentTourInvoiceId}
                          </td>
                          <td className="text-truncate double-row">
                            {agentInvoice.agentTourInvoiceDate}
                          </td>
                          <td className="text-truncate double-row title-row">
                            {agentInvoice.agentTourInvoiceTitle}
                          </td>
                          <td className="text-truncate double-row text-end price-row">
                            {new BigNumber(
                              agentInvoice.agentTourInvoicePricing
                            ).toFixed(2, 0)}
                            &nbsp;EUR
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
                                statusMap[agentInvoice.tourInvoiceStatusId];

                              return status ? (
                                <span className={status.className}>
                                  <i className={status.iconClass}></i>
                                  &nbsp;&nbsp;{status.text}
                                </span>
                              ) : null;
                            })()}
                          </td>

                          <td className="text-truncate double-row">
                            {agentInvoice.agent.agentName}
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
                                    disabled={!agentInvoice.authorities.print}
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
                                    name="agentTourInvoiceNumber"
                                    value={agentInvoice.agentTourInvoiceId}
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
                                  disabled={!agentInvoice.authorities.view}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                  disabled={!agentInvoice.authorities.edit}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                  disabled={!agentInvoice.authorities.post}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                  disabled={!agentInvoice.authorities.payments}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                    !agentInvoice.authorities.directDeposit
                                  }
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                  disabled={!agentInvoice.authorities.cancel}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                                  disabled={!agentInvoice.authorities.delete}
                                  value={agentInvoice.agentTourInvoiceId}
                                  onClick={() =>
                                    loadModalData(
                                      agentInvoice.agentTourInvoiceId
                                    )
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
                        agentTourInvoiceId: "",
                        agentTourInvoiceDate: "",
                        agentTourInvoiceTitle: "",
                        agentTourInvoiceDescription: "",
                        agentTourInvoicePricing: "",
                        items: [],
                        agent: {
                          authorities: "",
                          batchNo: "",
                          created: "",
                          createdBy: "",
                          lastModified: "",
                          lastModifiedBy: "",
                          agentId: "",
                          agentEmail: "",
                          token: "",
                          agentName: "",
                          agentPhone: "",
                          active: false,
                          agentAddress: "",
                          agentBusinessRegistrationNo: "",
                          agentBusinessRegistrationFile: "",
                          newsLetter: true,
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
                          agent: {
                            agentName: null,
                            agentPhone: null,
                            agentEmail: null,
                            agentAddress: null,
                            agentBusinessRegistrationNo: null,
                            agentBusinessRegistrationFile: null,
                          },
                        };
                      });
                      // Update customer list state
                      const newAgents = agents.map((x) => x);
                      setAgentsState(() => {
                        return newAgents;
                      });
                    }

                    function loadModalData(agentTourInvoiceId) {
                      const agentTourInvoice = objects.filter(
                        (agentTourInvoice) =>
                          agentTourInvoice.agentTourInvoiceId ===
                          agentTourInvoiceId
                      )[0];
                      const newAgentArray = agents.map((agent) => agent);
                      setAgentsState(() => {
                        return newAgentArray;
                      });
                      setTempVal(
                        () => agentTourInvoice.agentTourInvoiceDescription
                      );
                      setValSwitch(() => !valSwitch);
                      setModal(() => {
                        return {
                          batchNo: agentTourInvoice.batchNo,
                          created: agentTourInvoice.created,
                          createdBy: agentTourInvoice.createdBy,
                          lastModified: agentTourInvoice.lastModified,
                          lastModifiedBy: agentTourInvoice.lastModifiedBy,
                          agentTourInvoiceId:
                            agentTourInvoice.agentTourInvoiceId,
                          agentTourInvoiceDate:
                            agentTourInvoice.agentTourInvoiceDate,
                          agentTourInvoiceTitle:
                            agentTourInvoice.agentTourInvoiceTitle,
                          agentTourInvoiceDescription:
                            agentTourInvoice.agentTourInvoiceDescription,
                          agentTourInvoicePricing:
                            agentTourInvoice.agentTourInvoicePricing,
                          items: JSON.parse(
                            JSON.stringify(agentTourInvoice.items)
                          ),
                          agent: {
                            authorities: agentTourInvoice.agent.authorities,
                            batchNo: agentTourInvoice.agent.batchNo,
                            created: agentTourInvoice.agent.created,
                            createdBy: agentTourInvoice.agent.createdBy,
                            lastModified: agentTourInvoice.agent.lastModified,
                            lastModifiedBy:
                              agentTourInvoice.agent.lastModifiedBy,
                            agentId: agentTourInvoice.agent.agentId,
                            agentEmail: agentTourInvoice.agent.agentEmail,
                            token: agentTourInvoice.agent.token,
                            agentName: agentTourInvoice.agent.agentName,
                            agentPhone: agentTourInvoice.agent.agentPhone,
                            active: agentTourInvoice.agent.active,
                            agentAddress: agentTourInvoice.agent.agentAddress,
                            agentBusinessRegistrationNo:
                              agentTourInvoice.agent
                                .agentBusinessRegistrationNo,
                            agentBusinessRegistrationFile:
                              agentTourInvoice.agent
                                .agentBusinessRegistrationFile,
                            newsLetter: agentTourInvoice.agent.newsLetter,
                          },
                          tourInvoiceStatusId:
                            agentTourInvoice.tourInvoiceStatusId,
                          payments: agentTourInvoice.payments,
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
                          agent: {
                            agentName: null,
                            agentPhone: null,
                            agentEmail: null,
                            agentAddress: null,
                            agentBusinessRegistrationNo: null,
                            agentBusinessRegistrationFile: null,
                          },
                        };
                      });
                    }

                    function clearAgentModalData() {
                      // Revoke blob URL to free memory
                      if (modal.fileUrl) {
                        URL.revokeObjectURL(modal.fileUrl);
                      }

                      // ✅ Clear the file input manually
                      if (hiddenInputRef.current) {
                        hiddenInputRef.current.value = null;
                      }
                      setAgentModal(() => ({
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
                          agentId: "",
                          agentName: "",
                        },
                        hidden: {
                          created: "",
                          createdBy: "",
                          lastModified: "",
                          lastModifiedBy: "",
                        },
                        batchNo: "",
                        agentId: "",
                        agentEmail: "",
                        agentName: "",
                        agentPhone: "",
                        countryCode: "+49",
                        token: "",
                        agentAddress: "",
                        agentBusinessRegistrationNo: "",
                        agentBusinessRegistrationFile: "",
                        newsLetter: true,
                        active: false,
                      }));
                      // ✅ Optional: also clear uploadedFiles state if used
                      setUploadedFiles([]);
                      setErrors((prev) => {
                        return {
                          ...prev,
                          agent: {
                            agentName: null,
                            agentPhone: null,
                            agentEmail: null,
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
                                            agentTourInvoicePricing:
                                              new BigNumber(
                                                prevModal.agentTourInvoicePricing
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
                                    Agent Tour Invoice Management
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
                                    &nbsp;&nbsp;Add&nbsp;New&nbsp;Agent&nbsp;Tour&nbsp;Invoice&nbsp;&nbsp;&nbsp;
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
                                        <option value="agentTourInvoiceId">
                                          Tour&nbsp;Invoice&nbsp;ID
                                        </option>
                                        <option value="agentTourInvoiceDate">
                                          Tour&nbsp;Invoice&nbsp;Date
                                        </option>
                                        <option value="tourInvoiceTitle">
                                          Title
                                        </option>
                                        <option value="customerName">
                                          Agent Name
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
                                                        "agentTourInvoiceId"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "agentTourInvoiceId",
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
                                                    "agentTourInvoiceId"
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
                                                        "agentTourInvoiceDate"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "agentTourInvoiceDate",
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
                                                    "agentTourInvoiceDate"
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
                                                        "agentTourInvoiceTitle"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "agentTourInvoiceTitle",
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
                                                    "agentTourInvoiceTitle"
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
                                              Tour&nbsp;Invoice&nbsp;Price
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
                                                        "agentTourInvoicePricing"
                                                          ? prevSearchForm.sortOrder ===
                                                            "desc"
                                                            ? "asc"
                                                            : "desc"
                                                          : "asc";
                                                      return {
                                                        ...prevSearchForm,
                                                        sortType:
                                                          "agentTourInvoicePricing",
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
                                                    "agentTourInvoicePricing"
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
                                              Agent
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
                                    Agent Tour Invoice Management | View
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceDate}
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
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agent.agentName}
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
                                    {modal.agentTourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.agentTourInvoiceDescription,
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
                                          modal.agentTourInvoicePricing === ""
                                            ? "0"
                                            : modal.agentTourInvoicePricing
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
                                    Agent Tour Invoice Management | Delete
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceDate}
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
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agent.agentName}
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
                                    {modal.agentTourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.agentTourInvoiceDescription,
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
                                          modal.agentTourInvoicePricing === ""
                                            ? "0"
                                            : modal.agentTourInvoicePricing
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
                                      name="agentTourInvoiceId"
                                      value={modal.agentTourInvoiceId}
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
                                    Agent Tour Invoice Management | Add
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
                                        Agent
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
                                            data-bs-target="#addAgentModal"
                                            onClick={() => {
                                              clearAgentModalData();
                                            }}
                                          >
                                            &nbsp;
                                            <i className="fa-sharp fa-solid fa-circle-plus"></i>
                                            &nbsp;&nbsp; {"Add New Agent"}
                                            &nbsp;&nbsp;&nbsp;
                                          </button>
                                        </div>
                                      </div>
                                      <SearchFilterDropDown
                                        dataList={agentsState}
                                        value={modal.agent.agentId}
                                        handleChange={(agentId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              agent: {
                                                ...prev.agent,
                                                agentId: agentId,
                                              },
                                            };
                                          });
                                        }}
                                      />

                                      {errors.add.agentId &&
                                        errors.add.agentId.length > 0 && (
                                          <div className="text-danger mt-4 pt-1">
                                            {errors.add.agentId[0].message}
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
                                        value={modal.agentTourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentTourInvoiceTitle:
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
                                      {errors.add.agentTourInvoiceTitle &&
                                        errors.add.agentTourInvoiceTitle
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.add
                                                .agentTourInvoiceTitle[0]
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
                                              agentTourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                  </div>
                                  <div className="">
                                    {errors.add.agentTourInvoiceDescription &&
                                      errors.add.agentTourInvoiceDescription
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.add
                                              .agentTourInvoiceDescription[0]
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
                                          {errors.add.agentTourInvoicePricing &&
                                            errors.add.agentTourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.add
                                                    .agentTourInvoicePricing[0]
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
                                            modal.agentTourInvoicePricing === ""
                                              ? "0"
                                              : modal.agentTourInvoicePricing
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
                                    name="agentId"
                                    value={modal.agent.agentId}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="tourInvoiceDescription"
                                    value={modal.agentTourInvoiceDescription}
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
                                    Agent Tour Invoice Management | Edit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.agentTourInvoiceId}
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
                                    <div className="col-12 mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold"
                                      >
                                        Agent
                                      </label>
                                      <SearchFilterDropDown
                                        disabled
                                        dataList={agentsState}
                                        value={modal.agent.agentId}
                                        handleChange={(agentId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              agent: {
                                                ...prev.agent,
                                                agentId: agentId,
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
                                        id="title"
                                        name="tourInvoiceTitle"
                                        value={modal.agentTourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentTourInvoiceTitle:
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
                                      {errors.edit.agentTourInvoiceTitle &&
                                        errors.edit.agentTourInvoiceTitle
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.edit
                                                .agentTourInvoiceTitle[0]
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
                                              agentTourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                  </div>
                                  <div className="">
                                    {errors.edit.agentTourInvoiceDescription &&
                                      errors.edit.agentTourInvoiceDescription
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.edit
                                              .agentTourInvoiceDescription[0]
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
                                          {errors.edit
                                            .agentTourInvoicePricing &&
                                            errors.edit.agentTourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.edit
                                                    .agentTourInvoicePricing[0]
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
                                            modal.agentTourInvoicePricing === ""
                                              ? "0"
                                              : modal.agentTourInvoicePricing
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
                                    value={modal.agentTourInvoiceDescription}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="agentTourInvoiceId"
                                    value={modal.agentTourInvoiceId}
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
                                    Agent Tour Invoice Management | Post
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">
                                      Tour Invoice ID:{" "}
                                    </span>
                                    {modal.agentTourInvoiceId}
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
                                    <div className="col-12 mb-3">
                                      <label
                                        htmlFor="ItemDescription"
                                        className="form-label fw-bold"
                                      >
                                        Agent
                                      </label>
                                      <SearchFilterDropDown
                                        disabled
                                        dataList={agentsState}
                                        value={modal.agent.agentId}
                                        handleChange={(agentId) => {
                                          setModal((prev) => {
                                            return {
                                              ...prev,
                                              agent: {
                                                ...prev.agent,
                                                agentId: agentId,
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
                                        id="title"
                                        name="tourInvoiceTitle"
                                        value={modal.agentTourInvoiceTitle}
                                        onChange={(event) => {
                                          setModal((prevModal) => {
                                            return {
                                              ...prevModal,
                                              agentTourInvoiceTitle:
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
                                      {errors.post.agentTourInvoiceTitle &&
                                        errors.post.agentTourInvoiceTitle
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.post
                                                .agentTourInvoiceTitle[0]
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
                                              agentTourInvoiceDescription:
                                                description,
                                            };
                                          });
                                        }}
                                        valSwitch={valSwitch}
                                      />
                                    </div>
                                  </div>
                                  <div className="">
                                    {errors.post.agentTourInvoiceDescription &&
                                      errors.post.agentTourInvoiceDescription
                                        .length > 0 && (
                                        <div className="text-danger">
                                          {
                                            errors.post
                                              .agentTourInvoiceDescription[0]
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
                                          {errors.post
                                            .agentTourInvoicePricing &&
                                            errors.post.agentTourInvoicePricing
                                              .length > 0 && (
                                              <div className="text-danger">
                                                {
                                                  errors.post
                                                    .agentTourInvoicePricing[0]
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
                                            modal.agentTourInvoicePricing === ""
                                              ? "0"
                                              : modal.agentTourInvoicePricing
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
                                    name="tourInvoiceDescription"
                                    value={modal.agentTourInvoiceDescription}
                                    readOnly={true}
                                  />
                                  <input
                                    type="hidden"
                                    name="agentTourInvoiceId"
                                    value={modal.agentTourInvoiceId}
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
                                    Agent Tour Invoice Management | Direct
                                    Deposit
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceDate}
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
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agent.agentName}
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
                                    {modal.agentTourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.agentTourInvoiceDescription,
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
                                          modal.agentTourInvoicePricing === ""
                                            ? "0"
                                            : modal.agentTourInvoicePricing
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
                                      name="agentTourInvoiceId"
                                      value={modal.agentTourInvoiceId}
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
                                    Agent Tour Invoice Management | Cancel
                                    Invoice
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceId}
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
                                        {modal.agentTourInvoiceDate}
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
                                            Agent Name
                                          </div>
                                        </div>
                                      </th>
                                      <td className="text-truncate align-middle">
                                        {modal.agent.agentName}
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
                                    {modal.agentTourInvoiceTitle}
                                  </h5>
                                  <div
                                    className="quill-text"
                                    dangerouslySetInnerHTML={{
                                      __html: modal.agentTourInvoiceDescription,
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
                                          modal.agentTourInvoicePricing === ""
                                            ? "0"
                                            : modal.agentTourInvoicePricing
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
                                      name="agentTourInvoiceId"
                                      value={modal.agentTourInvoiceId}
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
                                    Agent Tour Invoice Management | Payments
                                    History
                                  </h4>
                                  <div className="mt-4 callback-text">
                                    <span className="fw-bold">Tour ID: </span>
                                    {modal.agentTourInvoiceId}
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

                        {/* add agent */}
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
                                    Agent Tour Invoices Management | Add Agent
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  id="addAgentModalClose"
                                  className="btn-close"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addInvoiceModal"
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
                                        value={agentModal.agentName}
                                        onChange={(event) => {
                                          setAgentModal((prevModal) => {
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
                                      {errors.agent.agentName &&
                                        errors.agent.agentName.length > 0 && (
                                          <div className="text-danger">
                                            {errors.agent.agentName[0].message}
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
                                        value={agentModal.agentEmail}
                                        onChange={(event) => {
                                          setAgentModal((prevModal) => {
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
                                      {errors.agent.agentEmail &&
                                        errors.agent.agentEmail.length > 0 && (
                                          <div className="text-danger">
                                            {errors.agent.agentEmail[0].message}
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
                                          value={agentModal.countryCode}
                                          onChange={(event) => {
                                            const newCountryCode =
                                              event.target.value;
                                            setAgentModal((prevModal) => ({
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
                                          value={agentModal.agentPhone}
                                          onChange={(event) => {
                                            const newPhone =
                                              validatePhoneNumber(
                                                validateInputText(
                                                  event.target.value
                                                )
                                              );
                                            setAgentModal((prevModal) => ({
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

                                      {errors.agent.agentPhone &&
                                        errors.agent.agentPhone.length > 0 && (
                                          <div className="text-danger">
                                            {errors.agent.agentPhone[0].message}
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
                                        value={agentModal.agentAddress}
                                        onChange={(event) => {
                                          setAgentModal((prevModal) => {
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
                                      {errors.agent.agentAddress &&
                                        errors.agent.agentAddress.length >
                                          0 && (
                                          <div className="text-danger">
                                            {
                                              errors.agent.agentAddress[0]
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
                                          agentModal.agentBusinessRegistrationNo
                                        }
                                        onChange={(event) => {
                                          setAgentModal((prevModal) => {
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
                                      {errors.agent
                                        .agentBusinessRegistrationNo &&
                                        errors.agent.agentBusinessRegistrationNo
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.agent
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
                                      {errors.agent
                                        .agentBusinessRegistrationFile &&
                                        errors.agent
                                          .agentBusinessRegistrationFile
                                          .length > 0 && (
                                          <div className="text-danger">
                                            {
                                              errors.agent
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
                                            checked={
                                              agentModal.newsLetter || false
                                            }
                                            onChange={(event) =>
                                              setAgentModal((prevModal) => ({
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
                                    Agent Tour Invoices Management | Add Tour
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
                                          agentTourInvoicePricing:
                                            new BigNumber(
                                              prev.agentTourInvoicePricing ===
                                              ""
                                                ? "0"
                                                : prev.agentTourInvoicePricing
                                            )
                                              .plus(
                                                new BigNumber(
                                                  itemModal.itemPrice
                                                )
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
                                    Agent Tour Invoices Management | Edit Tour
                                    Item
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
                                          agentTourInvoicePricing:
                                            new BigNumber(
                                              prev.agentTourInvoicePricing ===
                                              ""
                                                ? "0"
                                                : prev.agentTourInvoicePricing
                                            )
                                              .minus(
                                                new BigNumber(
                                                  modal.items[
                                                    itemModal.index
                                                  ].itemPrice
                                                )
                                              )
                                              .plus(
                                                new BigNumber(
                                                  itemModal.itemPrice
                                                )
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
