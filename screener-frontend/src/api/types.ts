export interface Screener {
  id: string;
  formSchema: {
    [key: string]: any;
  };

  // Allow for additional properties not explicitly defined here
  [x: string | number | symbol]: unknown;
}

// First Level of ResultDetails are Benefits
// Second Level of ResultDetails are Checks defining eligibility for that benefit 
export interface ResultDetail {
  displayName: string;
  result: boolean;
  info: string;
  appLink: string;
  checks: ResultDetail[],

  // Allow for additional properties not explicitly defined here
  [x: string | number | symbol]: unknown;
}
