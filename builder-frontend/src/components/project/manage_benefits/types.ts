/* Types for managing benefits in a project */

export interface ProjectBenefits {
  benefits: Benefit[];
}
export interface Benefit {
  id: string;
  name: string;
  description: string;
  checks: EligibilityCheck[];
}
export interface EligibilityCheck {
  id: string;
  description: string;
  category: string;
  inputs: Input[];
  parameters: Parameter[];
}

/* Check Input Types */
type Input = (
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
  validation: {
    required: boolean;
    min_length?: number;
    max_length?: number;
  };
}
interface StringSelectInput extends BaseInput {
  type: "string";
  options?: string;
  validation: {
    required: boolean;
  };
}
interface NumberInput extends BaseInput {
  type: "number";
  validation: {
    required: boolean;
    min?: number;
    max?: number;
  };
}
interface BooleanInput extends BaseInput {
  type: "boolean";
  // No additional validation needed for boolean
}

/* Parameter Types */
type Parameter = (
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
interface StringSelectParameter extends BaseParameter {
  type: "select_string";
  options?: string;
  value?: string;
}
interface StringMultiInputParameter extends BaseParameter {
  type: "multi_input_string";
  value?: string[];
}
interface StringParameter extends BaseParameter {
  type: "string";
  value?: string;
}
interface NumberParameter extends BaseParameter {
  type: "number";
  value?: number;
}
interface BooleanParameter extends BaseParameter {
  type: "boolean";
  value?: boolean;
}
