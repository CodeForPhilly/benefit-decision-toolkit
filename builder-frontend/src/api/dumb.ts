import { authFetch } from "./auth";

const apiUrl = import.meta.env.VITE_API_URL;

export const doDumb = async () => {
  const url = apiUrl + "/decision/v2/dumb";
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`failed`);
    }
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};