import { CheckConfig } from "@/types";
import { keyComboFromEvent } from "vanilla-jsoneditor";


export const determinePaths = (checks: CheckConfig[]): String[] => {
  const inputPaths: String[] = [];

  for (const check of checks) {
    let pathPrefix: String = "";
    const checkInputPaths: String[] = [];
    for (const [parameterKey, parameterValue] of Object.entries(check.parameters)) {
      if (parameterKey == "personId") {
        if (!parameterValue) {
          throw Error("Misconfigured Check Params");
        }

        pathPrefix = parameterValue.toString();
        break;
      }
    }

    for (const [parameterKey, parameterValue] of Object.entries(check.parameters)) {
    
    }
  }
  
  return inputPaths;
}