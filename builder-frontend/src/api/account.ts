import { env } from "@/config/environment";

import { authPost } from "@/api/auth";

const apiUrl = env.apiUrl;

export const runAccountHooks = async () => {
  const accountHookUrl = new URL(`${apiUrl}/account/hooks`);

  const hooksToCall = ["add example screener"];

  try {
    const response = await authPost(accountHookUrl.toString(), {
      hooks: hooksToCall,
    });

    if (!response.ok) {
      throw new Error(`Account hooks failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling account hooks:", error);
    throw error; // rethrow so you can handle it in your component if needed
  }
};

export const exportExampleScreener = async () => {
  const url = new URL(`${apiUrl}/account/export-example-screener`);

  try {
    const response = await authPost(url.toString());

    if (!response.ok) {
      return { success: false };
    }
    const data = (await response.json()) as { success: boolean };
    return data;
  } catch (err) {
    console.error("Error calling account hooks:", err);
    return { success: false };
  }
};
