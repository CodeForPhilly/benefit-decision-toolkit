import { env } from "@/config/environment";

import { authPost } from "@/api/auth";

const apiUrl = env.apiUrl;

export const runAccountHooks = async () => {
  const accountHookUrl = new URL(`${apiUrl}/account-hooks`);

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
