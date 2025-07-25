import { getAuth } from "firebase/auth";

export async function authFetch(input, init = {}) {
  const auth = getAuth();
  const user = auth.currentUser;

  // If no user is logged in, you can handle it accordingly
  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
