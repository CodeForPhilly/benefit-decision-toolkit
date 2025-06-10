import { debounce } from "lodash";

export const StorageKeys = {
  SELECTED_PROJECT: "selectedProject",
  FORM_SCHEMA: "formSchema",
  DMN_MODEL: "dmnModel",
};

export const getFormSchemaFromStorage = () => {
  const schema = sessionStorage.getItem(StorageKeys.FORM_SCHEMA);
  if (schema) {
    return JSON.parse(schema);
  } else return undefined;
};

export const getDmnModelFromStorage = () => {
  const dmnEscaped = sessionStorage.getItem(StorageKeys.DMN_MODEL);

  const dmn = dmnEscaped
    .replace(/\\"/g, '"')
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n");

  if (!dmn || dmn == "null") {
    return undefined;
  } else {
    return dmn;
  }
};

export const getSelectedProjectFromStorage = () => {
  const project = sessionStorage.getItem(StorageKeys.SELECTED_PROJECT);
  if (project) {
    return JSON.parse(project);
  } else return undefined;
};

export const saveFormSchemaToStorageDebounced = debounce((schema) => {
  sessionStorage.setItem(StorageKeys.FORM_SCHEMA, JSON.stringify(schema));
}, 500);

export const saveDmnModelToStorageDebounced = debounce((model) => {
  console.log("saving");
  console.log(model);
  sessionStorage.setItem(StorageKeys.DMN_MODEL, model);
}, 500);

export const saveSelectedProjectToStorage = (project) => {
  sessionStorage.setItem(StorageKeys.SELECTED_PROJECT, JSON.stringify(project));
};

export const saveScreenerDataToStorage = (screenerData) => {
  sessionStorage.setItem(
    StorageKeys.SELECTED_PROJECT,
    JSON.stringify(screenerData)
  );
  sessionStorage.setItem(
    StorageKeys.FORM_SCHEMA,
    JSON.stringify(screenerData.formSchema)
  );
  sessionStorage.setItem(
    StorageKeys.DMN_MODEL,
    JSON.stringify(screenerData.dmnModel)
  );
};

export const clearSessionStorage = () => {
  sessionStorage.removeItem(StorageKeys.SELECTED_PROJECT);
  sessionStorage.removeItem(StorageKeys.FORM_SCHEMA);
  sessionStorage.removeItem(StorageKeys.DMN_MODEL);
};
