import type { EligibilityCheck, OptionalBoolean } from "@/types";
import { authGet, authPost, authPut } from "@/api/auth";

export const fetchPublicChecks = async (): Promise<EligibilityCheck[]> => {
  const url = "/api/library-checks";
  try {
    const response = await authGet(url);

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching checks:", error);
    // TODO: handle error appropriately
    return [];
  }
};

export const fetchCheck = async (
  checkId: string,
): Promise<EligibilityCheck> => {
  const checkResource = checkId[0] === "L" ? "library-checks" : "custom-checks";
  const url = `/api/${checkResource}/${checkId}`;

  try {
    const response = await authGet(url);

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
  const url = "/api/custom-checks";
  try {
    const response = await authPost(url, {
      headers: { "Content-Type": "application/json" },
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
  const url = "/api/custom-checks";
  try {
    const response = await authPut(url, {
      headers: { "Content-Type": "application/json" },
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
  const url = "/api/save-check-dmn";
  try {
    const response = await authPost(url, {
      headers: { "Content-Type": "application/json" },
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

export const validateCheckDmn = async (
  checkId: string,
  dmnModel: string,
): Promise<string[]> => {
  const url = "/api/validate-check-dmn";
  try {
    const response = await authPost(url, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: checkId, dmnModel: dmnModel }),
    });

    if (!response.ok) {
      throw new Error(`Validation failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.errors;
  } catch (error) {
    console.error("Error validation DMN for check:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchUserDefinedChecks = async (
  working: boolean,
): Promise<EligibilityCheck[]> => {
  const url = `/api/custom-checks?working=${working}`;

  try {
    const response = await authGet(url);

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

export const evaluateWorkingCheck = async (
  checkId: string,
  checkConfig: any,
  inputData: Record<string, any>,
): Promise<OptionalBoolean> => {
  const url = `/api/decision/working-check?checkId=${checkId}`;
  try {
    const response = await authPost(url, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkConfig, inputData }),
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
};

export const getRelatedPublishedChecks = async (
  checkId: string,
): Promise<EligibilityCheck[]> => {
  const url = `/api/custom-checks/${checkId}/published-check-versions`;
  try {
    const response = await authGet(url);

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching related published checks:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const publishCheck = async (
  checkId: string,
): Promise<OptionalBoolean> => {
  const url = `/api/publish-check/${checkId}`;
  try {
    const response = await authPost(url, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
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
