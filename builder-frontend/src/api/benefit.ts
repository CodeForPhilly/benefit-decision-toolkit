import { authFetch } from "@/api/auth";

import { Benefit } from "@/types";

const apiUrl = import.meta.env.VITE_API_URL;

export const fetchScreenerBenefit = async (srceenerId: string, benefitId: string): Promise<Benefit> => {
  const url = apiUrl + "/screener/" + srceenerId + "/benefit/" + benefitId;
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
    return data as Benefit;
  } catch (error) {
    console.error("Error fetching screener:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const updateScreenerBenefit = async (screenerId: string, benefitData: Benefit): Promise<Benefit> => {
  const url = apiUrl + "/screener/" + screenerId + "/benefit";
  try {
    const response = await authFetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(benefitData),
    });

    if (!response.ok) {
      throw new Error(`Update failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data as Benefit;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};


export const fetchPublicBenefits = async (): Promise<Benefit[]> => {
  const url = apiUrl + "/benefit";
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
    console.error("Error fetching benefits:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};
