import { authFetch, authGet, authPut } from "@/api/auth";

import type { ScreenerTest } from "@/types";

const apiUrl = import.meta.env.VITE_API_URL;

export const getScreenerTestResult = async (screenerTestId) => {
    const url = apiUrl + "/screenerTest/" + screenerTestId;
  try {
    const response = await authGet(url);

    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching screener test:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const testScreener = async (testScreenerData: ScreenerTest) => {
  const url = apiUrl + "/screenerTest";
  try {
    const response = await authPut(url, testScreenerData);
    console.log("test inserted(?)");

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};
