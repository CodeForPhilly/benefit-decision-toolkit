import { auth } from "../firebase/firebase.js";

type RestMethod = "GET" | "PATCH" | "POST" | "PUT" | "DELETE";

export const authFetch =
  (method: RestMethod) => async (url: string, body?: any) => {
    const user = auth.currentUser;

    // If no user is logged in, you can handle it accordingly
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    // set headers based on method
    if (method === "GET") {
      headers.set("Accept", "application/json");
    } else if (method === "POST" || method === "PUT" || method === "PATCH") {
      headers.set("Accept", "application/json");
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    });
  };

export const authGet = authFetch("GET");
export const authPost = authFetch("POST");
export const authPut = authFetch("PUT");
export const authPatch = authFetch("PATCH");
export const authDelete = authFetch("DELETE");
