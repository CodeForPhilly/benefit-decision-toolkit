import { Screener, ResultDetail } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;

export const fetchScreenerData = async (screenerId: string): Promise<Screener> => {
  try {
    const response = await fetch(`${BASE_URL}screener/${screenerId}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error: failed to fetch screener form data", error);
    throw error;
  }
};

export const getDecisionResult = async (screenerId: string, data: any): Promise<ResultDetail[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}decision?screenerId=${screenerId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit form");
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.log("Error submitting form");
    console.log(error);
    throw error;
  }
};
