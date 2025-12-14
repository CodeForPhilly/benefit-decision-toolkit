import { auth } from "../firebase/firebase.js";

type RestMethod = "GET" | "POST";
type FetchInit = {
  headers: Record<string, string>;
  body: string;
};

export const authFetch =
  (method: RestMethod) => async (url: string, init?: FetchInit) => {
    const user = auth.currentUser;

    // If no user is logged in, you can handle it accordingly
    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    const basicHeaders = { Accept: "application/json" };
    const headers = new Headers({ ...basicHeaders, ...init?.headers });
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, { method, ...init, headers });
  };

export const authGet = authFetch("GET");
export const authPost = authFetch("POST");
