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
  parameters: ParameterValues;
}
export interface ParameterValues {
  [key: string]: string | number | boolean | string[];
}

export interface EligibilityCheck {
  id: string;
  name: string;
  module: string;
  description: string;
  inputs: InputDefinition[];
  parameters: ParameterDefinition[];
}

/* Check Input Types */
type InputDefinition = (
  StringInput |
  StringSelectInput |
  NumberInput |
  BooleanInput
);
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

/* Parameter Types */
export type ParameterDefinition = (
  StringParameter |
  StringSelectParameter |
  StringMultiInputParameter |
  NumberParameter |
  BooleanParameter
);
interface BaseParameter {
  key: string;
  label: string;
  required: boolean;
}
export interface StringSelectParameter extends BaseParameter {
  type: "select";
  options?: string;
}
export interface StringMultiInputParameter extends BaseParameter {
  type: "multi_input_string";
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
