/* Types for managing benefits in a project */

export interface ProjectBenefits {
  benefits: Benefit[];
}
export interface Benefit {
  id: string;
  name: string;
  description: string;
  checks: Check[];
}
export interface Check {
  id: string;
  value: string;
  inputs: CheckInput[];
  parameters: CheckParameter[];
}

/* Check Input Types */
type CheckInput = StringCheckInput | NumberCheckInput | BooleanCheckInput;
interface BaseCheckInput {
  id: string;
  name: string;
  description: string;
}
interface StringCheckInput extends BaseCheckInput {
  type: "string";
  value?: string;
}
interface NumberCheckInput extends BaseCheckInput {
  type: "number";
  value?: number;
}
interface BooleanCheckInput extends BaseCheckInput {
  type: "boolean";
  value?: boolean;
}

/* Check Parameter Types */
type CheckParameter = StringCheckParameter | NumberCheckParameter | BooleanCheckParameter;
interface BaseCheckParameter {
  id: string;
  name: string;
  description: string;
}
interface StringCheckParameter extends BaseCheckParameter {
  type: "string";
  value?: string;
}
interface NumberCheckParameter extends BaseCheckParameter {
  type: "number";
  value?: number;
}
interface BooleanCheckParameter extends BaseCheckParameter {
  type: "boolean";
  value?: boolean;
}