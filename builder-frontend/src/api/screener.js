import { authFetch } from "./auth";
const apiUrl = import.meta.env.VITE_API_URL;

export const fetchProjects = async () => {
  const url = apiUrl + "/screeners";
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

export const fetchProject = async (screenerId) => {
  const url = apiUrl + "/screener/" + screenerId;
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
  const url = apiUrl + "/screener";
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
  const url = apiUrl + "/screener";
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
  const url = apiUrl + "/screener/delete?screenerId=" + screenerData.id;
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
  const requestData = {};
  requestData.screenerId = screenerId;
  requestData.schema = schema;
  const url = apiUrl + "/save-form-schema";
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

export const saveDmnModel = async (screenerId, dmnModel) => {
  console.log(dmnModel);
  const requestData = {};
  requestData.screenerId = screenerId;
  requestData.dmnModel = dmnModel;
  const url = apiUrl + "/save-dmn-model";
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
      throw new Error(`Save failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error saving DMN:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const submitForm = async (screenerId, formData) => {
  const url = apiUrl + "/decision?screenerId=" + screenerId;
  if (!formData || Object.keys(formData).length === 0) return {};

  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Submit failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const publishScreener = async (screenerId) => {
  const url = apiUrl + "/publish";
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};

export const addDependency = async (screenerId, dependency) => {
  const url = apiUrl + "/dependency";
  console.log({ screenerId });
  try {
    const response = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        screenerId: screenerId,
        groupId: dependency.groupId,
        artifactId: dependency.artifactId,
        version: dependency.version,
      }),
    });

    if (!response.ok) {
      throw new Error(`Model import failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error adding dependency:", error);
    throw error;
  }
};
