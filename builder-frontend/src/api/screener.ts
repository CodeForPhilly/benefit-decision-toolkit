import { authFetch } from "@/api/auth";

import type { BenefitDetail, ScreenerResult } from "@/types";

export const fetchProjects = async () => {
  const url = "/api/screeners";
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
    console.error("Error fetching projects:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchProject = async (screenerId: string) => {
  const url = `/api/screener/${screenerId}`;
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
    console.error("Error fetching screener:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const createNewScreener = async (screenerData) => {
  const url = "/api/screener";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(screenerData),
    });

    if (!response.ok) {
      throw new Error(`Post failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating new project:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const updateScreener = async (screenerData) => {
  const url = "/api/screener";
  try {
    const response = await authFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(screenerData),
    });

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteScreener = async (screenerData) => {
  const url = "/api/screener/delete?screenerId=" + screenerData.id;
  try {
    const response = await authFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const saveFormSchema = async (screenerId, schema) => {
  const requestData: any = {};
  requestData.screenerId = screenerId;
  requestData.schema = schema;
  const url = "/api/save-form-schema";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Post failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error saving form schema:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const publishScreener = async (screenerId: string): Promise<void> => {
  const url = "/api/publish";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ screenerId: screenerId }),
    });

    if (!response.ok) {
      throw new Error(`Submit failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};

export const addCustomBenefit = async (
  screenerId: string,
  benefit: BenefitDetail
) => {
  const url = `/api/screener/${screenerId}/benefit`;
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(benefit),
    });

    if (!response.ok) {
      throw new Error(`Create benefit failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error creating benefit:", error);
    throw error;
  }
};

export const removeCustomBenefit = async (
  screenerId: string,
  benefitId: string
) => {
  const url = `/screener/${screenerId}/benefit/${benefitId}`;
  try {
    const response = await authFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Delete of benefit failed with status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error deleting custom benefit:", error);
    throw error;
  }
};

export const evaluateScreener = async (
  screenerId: string,
  inputData: any
): Promise<ScreenerResult> => {
  const url = `/api/decision/v2?screenerId=${screenerId}`;
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(inputData),
    });

    if (!response.ok) {
      throw new Error(`Evaluation failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error evaluating:", error);
    throw error;
  }
};
