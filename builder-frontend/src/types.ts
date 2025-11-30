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
  // API endpoint for evaluating check (only for library checks)
  path?: string;
  parameters: ParameterValues;
}
export interface ParameterValues {
  [key: string]: string | number | boolean | string[];
}

export interface EligibilityCheck {
  id: string;
  name: string;
  module: string;
  version: number;
  description: string;
  inputs: InputDefinition[];
  parameters: ParameterDefinition[];
  // API endpoint for evaluating check (Library checks only)
  path?: string;
}
export interface EligibilityCheckDetail extends EligibilityCheck {
  dmnModel: string;
}

// Check Input Types
type InputDefinition =
  | StringInput
  | StringSelectInput
  | NumberInput
  | BooleanInput;
interface BaseInput {
  key: string;
  prompt: string;
}
interface StringInput extends BaseInput {
  type: "string";
}
interface StringSelectInput extends BaseInput {
  type: "select";
  options?: string;
}
interface NumberInput extends BaseInput {
  type: "number";
}
interface BooleanInput extends BaseInput {
  type: "boolean";
  // No additional validation needed for boolean
}

// Parameter Types
export type ParameterDefinition =
  | StringParameter
  // StringSelectParameter |
  // StringMultiInputParameter |
  | NumberParameter
  | BooleanParameter;
interface BaseParameter {
  key: string;
  label: string;
  required: boolean;
}
// export interface StringSelectParameter extends BaseParameter {
//   type: "select";
//   options?: string;
// }
// export interface StringMultiInputParameter extends BaseParameter {
//   type: "multi_input_string";
// }
export interface StringParameter extends BaseParameter {
  type: "string";
}
export interface NumberParameter extends BaseParameter {
  type: "number";
}
export interface BooleanParameter extends BaseParameter {
  type: "boolean";
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
interface CheckResult {
  name: string;
  result: OptionalBoolean;
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
