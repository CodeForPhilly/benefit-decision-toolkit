import type { JSONSchema7 } from 'json-schema';

/* Types for managing benefits in a project */
export interface ScreenerBenefits {
  benefits: BenefitDetail[];
}
export interface BenefitDetail {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
}

export interface Benefit {
  id: string;
  name: string;
  description: string;
  checks: CheckConfig[];
}
// An EligibilityCheck, as configured by a particular Benefit
export interface CheckConfig {
  checkId: string;
  checkName: string;
  checkVersion: string;
  checkModule: string;
  checkDescription: string;
  // API endpoint for evaluating check (only for library checks)
  evaluationUrl?: string;
  parameters: ParameterValues;
  inputDefinition: JSONSchema7;
  parameterDefinitions: ParameterDefinition[];
}
export interface ParameterValues {
  [key: string]: string | number | boolean | string[];
}

export interface EligibilityCheck {
  id: string;
  name: string;
  module: string;
  version: string;
  description: string;
  inputDefinition: JSONSchema7;
  parameterDefinitions: ParameterDefinition[];
  // API endpoint for evaluating check (Library checks only)
  evaluationUrl?: string;
}
export interface EligibilityCheckDetail extends EligibilityCheck {
  dmnModel: string;
}

// Request types for EligibilityCheck API endpoints
export interface CreateCheckRequest {
  name: string;
  module: string;
  description: string;
  parameterDefinitions: ParameterDefinition[];
}

export interface UpdateCheckRequest {
  description?: string;
  parameterDefinitions?: ParameterDefinition[];
}

// Parameter Types
export type ParameterType = "string" | "number" | "boolean" | "date" | "array";
export type ParameterDefinition =
  | StringParameter
  | StringMultiInputParameter
  | NumberParameter
  | BooleanParameter
  | DateParameter;
interface BaseParameter {
  key: string;
  label: string;
  required: boolean;
}
export interface StringMultiInputParameter extends BaseParameter {
  type: "array";
}
export interface StringParameter extends BaseParameter {
  type: "string";
}
export interface NumberParameter extends BaseParameter {
  type: "number";
}
export interface BooleanParameter extends BaseParameter {
  type: "boolean";
}
export interface DateParameter extends BaseParameter {
  type: "date";
}

/* Screener Evaluation Results */
export interface ScreenerResult {
  [key: string]: BenefitResult;
}
export interface BenefitResult {
  name: string;
  result: OptionalBoolean;
  check_results: {
    [key: string]: CheckResult;
  };
}
export interface CheckResult {
  name: string;
  result: OptionalBoolean;
  module: string;
  version: string;
  parameters: ParameterValues;
}
export type OptionalBoolean = "TRUE" | "FALSE" | "UNABLE_TO_DETERMINE";

/* Form Data for Preview */
export interface PreviewFormData {
  [key: string]: any;
}

// Published Screener Types
export interface PublishedScreener {
  screenerName: string;
  formSchema: any;
}
