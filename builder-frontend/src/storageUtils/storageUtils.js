export const StorageKeys = {
  SELECTED_PROJECT: "selectedProject",
  FORM_SCHEMA: "formSchema",
  DMN_MODEL: "dmnModel",
  TAB: "tab",
};

export const getCachedDependency = (dep) => {
  const key = `${dep.groupId}:${dep.artifactId}:${dep.version}`;
  return sessionStorage.getItem(key);
};

export const cacheDependency = (dep) => {
  console.log("cache dep");
  const key = `${dep.groupId}:${dep.artifactId}:${dep.version}`;
  return sessionStorage.setItem(key, dep.xml);
};
