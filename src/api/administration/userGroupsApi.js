import { API_URI } from "../apiConfig";

export async function searchUserGroups(
  searchBy,
  searchValue,
  page,
  sortType,
  sortOrder
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/user-groups/search-user-groups?` +
      new URLSearchParams({
        searchBy: searchBy,
        searchValue: searchValue,
        page: page,
        sortType: sortType,
        sortOrder: sortOrder,
      }),
    {
      headers: headers,
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
  return {
    authorities: {
      add: true,
    },
    pagination: {
      page: 1,
      count: 2,
    },
    userGroups: [
      {
        userGroupId: "PWE-1",
        userGroupDescription: "ADMINISTRATOR",
        numberOfUsers: "2",
        batchNo: "PWE-1",
        accessDuration: "13",
        authorities: {
          view: true,
          privileges: true,
          edit: true,
          delete: true,
        },
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        userGroupId: "PWE-2",
        userGroupDescription: "MANAGER",
        numberOfUsers: "2",
        batchNo: "PWE-2",
        authorities: {
          view: true,
          privileges: true,
          edit: true,
          delete: true,
        },
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        userGroupId: "PWE-3",
        userGroupDescription: "CUSTOMER SUPPORT",
        numberOfUsers: "2",
        batchNo: "PWE-3",
        authorities: {
          view: true,
          privileges: true,
          edit: true,
          delete: true,
        },
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
    ],
  };
}

export async function addUserGroup(
  userGroupDescription,
  accessDuration,
  modulePrivileges
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");

  // Make sure modulePrivileges is passed correctly
  const response = await fetch(`${API_URI}/admin/user-groups/add-user-group`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      userGroupDescription: userGroupDescription,
      accessDuration: accessDuration,
      modulePrivileges: modulePrivileges, // This is now an array of module privileges
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
  const is_success = false;
  if (!is_success) {
    return {
      message: {
        success: false,
        message: "Failed to create new user group.",
      },
      errors: [
        {
          name: "addUserGroupDescription",
          message: "The user group description already exists.",
        },
      ],
    };
  }
  return {
    message: {
      success: true,
      message: "User group successfully created.",
    },
    errors: [],
  };
}

export async function editUserGroup(
  userGroupId,
  userGroupDescription,
  accessDuration,
  batchNo
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(`${API_URI}/admin/user-groups/edit-user-group`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      userGroupId: userGroupId,
      userGroupDescription: userGroupDescription,
      accessDuration: accessDuration,
      batchNo: batchNo,
    }),
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
  const is_success = false;
  if (!is_success) {
    return {
      message: {
        success: false,
        message: "Failed to update user group.",
      },
      errors: [
        {
          name: "editUserGroupDescription",
          message: "The user group description already exists.",
        },
      ],
    };
  }
  return {
    message: {
      success: true,
      message: "User group successfully edited.",
    },
    errors: [],
  };
}

export async function deleteUserGroup(userGroupId, batchNo) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");
  const response = await fetch(
    `${API_URI}/admin/user-groups/delete-user-group`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        userGroupId: userGroupId,
        batchNo: batchNo,
      }),
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
  const is_success = false;
  if (!is_success) {
    return {
      message: {
        success: false,
        message: "Failed to delete user group.",
      },
      errors: [],
    };
  }
  return {
    message: {
      success: true,
      message: "User group successfully deleted.",
    },
    errors: [],
  };
}

export async function searchPrivileges(userGroupId) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  const response = await fetch(
    `${API_URI}/admin/user-groups/search-privileges?` +
      new URLSearchParams({
        userGroupId: userGroupId,
      }),
    {
      headers: headers,
    }
  );
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
  return {
    userGroup: {
      userGroupId: "PWE-1",
      userGroupDescription: "ADMINISTRATOR",
      batchNo: "PWE-1",
    },
    modules: [
      { id: "PWE-1", description: "ADMINISTRATION" },
      { id: "PWE-2", description: "INVOICING" },
    ],
    features: [
      { id: "PWE-1", description: "USERS", module: "PWE-1" },
      { id: "PWE-2", description: "USER GROUPS", module: "PWE-1" },
      { id: "PWE-3", description: "PRIVILEGES", module: "PWE-1" },
    ],
    authorities: { update: true, view: true },
    privileges: [
      {
        privilegeId: "PWE-1",
        feature: "PWE-1",
        module: "PWE-1",
        privilegedAction: "ADD",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        privilegeId: "PWE-2",
        feature: "PWE-1",
        module: "PWE-1",
        privilegedAction: "VIEW",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        privilegeId: "PWE-3",
        feature: "PWE-1",
        module: "PWE-1",
        privilegedAction: "EDIT",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        privilegeId: "PWE-4",
        feature: "PWE-1",
        module: "PWE-1",
        privilegedAction: "DELETE",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        privilegeId: "PWE-5",
        feature: "PWE-2",
        module: "PWE-1",
        privilegedAction: "ADD",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
      {
        privilegeId: "PWE-6",
        feature: "PWE-2",
        module: "PWE-1",
        privilegedAction: "VIEW",
        granted: true,
        hidden: {
          created: "2023-11-02 13:00:56",
          createdBy: "IURATNAYAKE",
          lastModified: "2023-11-02 13:00:56",
          lastModifiedBy: "IURATNAYAKE",
        },
      },
    ],
  };
}

export async function updatePrivileges(userGroupId, batchNo, privileges) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);
  headers.append("Content-Type", "application/json");

  const response = await fetch(
    `${API_URI}/admin/user-groups/update-privileges`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        userGroupId: userGroupId,
        batchNo: batchNo,
        privileges: privileges, // Send privileges as an array, not a string
      }),
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  return null;

  const is_success = false;
  if (!is_success) {
    return {
      message: {
        success: false,
        message: "Failed to update user group.",
      },
      errors: [],
    };
  }
  return {
    message: {
      success: true,
      message: "User group successfully updated.",
    },
    errors: [],
  };
}
