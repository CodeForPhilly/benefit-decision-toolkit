import { env } from "@/config/environment";

import { authGet } from "@/api/auth";

const apiUrl = env.apiUrl;

export const getAccountHooks = async () => {
  const searchParams = new URLSearchParams([
    ["action", "add example screener"],
  ]);
  const accountHookUrl = new URL(
    `${apiUrl}/account-hooks?${searchParams.toString()}`,
  );

  try {
    const response = await authGet(accountHookUrl.toString());

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
