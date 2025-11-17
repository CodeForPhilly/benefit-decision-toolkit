import { authFetch } from "@/api/auth";

import type { EligibilityCheck, OptionalBoolean } from "@/types";

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchPublicChecks = async (): Promise<EligibilityCheck[]> => {
  const url = apiUrl + "/checks";
  try {
    const response = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching checks:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchCheck = async (
  checkId: string
): Promise<EligibilityCheck> => {
  const url = apiUrl + `/checks/${checkId}`;
  try {
    const response = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched check:", data);
    return data;
  } catch (error) {
    console.error("Error fetching check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchCustomCheck = async (
  checkId: string
): Promise<EligibilityCheck> => {
  const url = apiUrl + `/custom-checks/${checkId}`;
  try {
    const response = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched custom check:", data);
    return data;
  } catch (error) {
    console.error("Error fetching custom check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const addCheck = async (check: EligibilityCheck) => {
  const url = apiUrl + "/custom-checks";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(check),
    });

    if (!response.ok) {
      throw new Error(`Post failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating new check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const updateCheck = async (check: EligibilityCheck) => {
  const url = apiUrl + "/custom-checks";
  try {
    const response = await authFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(check),
    });

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const saveCheckDmn = async (checkId: string, dmnModel: string) => {
  const url = apiUrl + "/save-check-dmn";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ id: checkId, dmnModel: dmnModel }),
    });

    if (!response.ok) {
      throw new Error(`DMN save failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error saving DMN for check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchUserDefinedChecks = async (
  working: boolean
): Promise<EligibilityCheck[]> => {
  let url: string;
  if (working) {
    url = apiUrl + "/custom-checks?working=true";
  } else {
    url = apiUrl + "/custom-checks?working=false";
  }

  try {
    const response = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching checks:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const evaluateWorkingCheck = async (checkId: string, checkConfig: any, inputData: Record<string, any>): Promise<OptionalBoolean> => {
  const url = apiUrl + `/decision/v2/working_check?checkId=${checkId}`;
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ checkConfig: checkConfig, inputData: inputData }),
    });

    if (!response.ok) {
      throw new Error(`Test check failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data["result"];
  } catch (error) {
    console.error("Error testing check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
}

export const getRelatedPublishedChecks = async (checkId: string): Promise<EligibilityCheck[]> => {
  const url = apiUrl + `/custom-checks/${checkId}/related_published_checks`;
  try {
    const response = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching related published checks:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
}

export const publishCheck = async (checkId: string): Promise<OptionalBoolean> => {
  const url = apiUrl + `/publish-check/${checkId}`;
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Publish failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data["result"];
  } catch (error) {
    console.error("Error publishing check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};
