import type { PublishedScreener, ScreenerResult } from "@/types";

export const fetchPublishedScreener = async (
  publishedScreenerId: string
): Promise<PublishedScreener> => {
  const url = `/api/published/screener/${publishedScreenerId}`;
  try {
    const response = await fetch(url, {
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
    console.error("Error fetching published screener:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const evaluatePublishedScreener = async (
  publishedScreenerId: string,
  inputData: any
): Promise<ScreenerResult> => {
  const url = `/published/${publishedScreenerId}/evaluate`;
  try {
    const response = await fetch(url, {
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
