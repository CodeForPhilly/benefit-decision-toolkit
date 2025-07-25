import { authFetch } from "./auth";
const apiUrl = import.meta.env.VITE_API_URL;

export const fetchAvailableModels = async () => {
  const url = apiUrl + "/dmn-models";
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
    console.error("Error fetching models:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const fetchModel = async (groupId, artifactId, version) => {
  const url = apiUrl + `/dmn-models/${groupId}/${artifactId}/${version}`;
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
    console.log("returned xml");
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching model:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};
