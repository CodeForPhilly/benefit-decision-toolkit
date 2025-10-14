import { authFetch } from "./auth";

import type { EligibilityCheck } from "../components/project/manageBenefits/types";

const apiUrl = import.meta.env.VITE_API_URL;


export const fetchPublicChecks = async (): Promise<EligibilityCheck[]> => {
  const url = apiUrl + "/check";
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

export const fetchCheck = async (checkId: string): Promise<EligibilityCheck> => {
  const url = apiUrl + `/check/${checkId}`;
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

export const fetchUserDefinedChecks = async (): Promise<EligibilityCheck[]> => {
  // Simulate an API call delay -- TODO: update to greater than 1ms delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [];
};
