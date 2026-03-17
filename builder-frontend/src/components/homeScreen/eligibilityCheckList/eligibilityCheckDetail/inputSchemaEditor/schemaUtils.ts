import type { JSONSchema7 } from "json-schema";
import type {
  InputSchemaEditorState,
  SituationSchemaConfig,
  PeopleSchemaConfig,
  ParameterSchemaProperty,
  ParameterType,
  PeopleKeyDefinition,
} from "@/types";

// Default empty state for the editor
export const getDefaultEditorState = (): InputSchemaEditorState => ({
  situation: {
    people: {
      keys: [],
    },
    simpleChecks: [],
  },
  parameters: [],
});

// Create a new people key with default properties
export const createDefaultPeopleKey = (isParameterReference: boolean): PeopleKeyDefinition => ({
  value: "",
  isParameterReference,
  includeDateOfBirth: false,
  includeEnrollments: false,
});

// Convert a ParameterType to JSON Schema type
const parameterTypeToJsonSchemaType = (
  type: ParameterType
): { type: string; format?: string; items?: { type: string } } => {
  switch (type) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date" };
    case "array":
      return { type: "array", items: { type: "string" } };
    default:
      return { type: "string" };
  }
};

// Convert JSON Schema type back to ParameterType
const jsonSchemaTypeToParameterType = (
  schemaProperty: JSONSchema7
): ParameterType => {
  if (schemaProperty.type === "array") {
    return "array";
  }
  if (schemaProperty.type === "string" && schemaProperty.format === "date") {
    return "date";
  }
  if (schemaProperty.type === "number") {
    return "number";
  }
  if (schemaProperty.type === "boolean") {
    return "boolean";
  }
  return "string";
};

// Convert editor state to a valid JSON Schema
export const convertEditorStateToJsonSchema = (
  state: InputSchemaEditorState
): JSONSchema7 => {
  const schema: JSONSchema7 = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      situation: buildSituationSchema(state.situation),
      parameters: buildParametersSchema(state.parameters),
    },
    required: ["situation", "parameters"],
  };

  return schema;
};

// Build the person properties schema for a specific key definition
const buildPersonPropertiesSchema = (keyDef: PeopleKeyDefinition): Record<string, JSONSchema7> => {
  const personProperties: Record<string, JSONSchema7> = {};

  if (keyDef.includeDateOfBirth) {
    personProperties.dateOfBirth = {
      type: "string",
      format: "date",
      description: "The person's date of birth in ISO 8601 format (YYYY-MM-DD)",
    };
  }

  if (keyDef.includeEnrollments) {
    personProperties.enrollments = {
      type: "array",
      description: "List of benefit programs this person is enrolled in",
      items: { type: "string" },
    };
  }

  return personProperties;
};

// Build the situation portion of the schema
const buildSituationSchema = (config: SituationSchemaConfig): JSONSchema7 => {
  const situationProperties: Record<string, JSONSchema7> = {};
  const situationRequired: string[] = [];

  // Build people schema if any keys are defined with at least one property
  const keysWithProperties = config.people.keys.filter(
    (k) => k.includeDateOfBirth || k.includeEnrollments
  );

  if (keysWithProperties.length > 0) {
    const peopleProperties: Record<string, JSONSchema7> = {};

    for (const keyDef of keysWithProperties) {
      // Use the key as-is (either static like "client" or template like "{personId}")
      const keyName = keyDef.isParameterReference ? `{${keyDef.value}}` : keyDef.value;
      const personProperties = buildPersonPropertiesSchema(keyDef);

      peopleProperties[keyName] = {
        type: "object",
        description: keyDef.isParameterReference
          ? `Person identified by the ${keyDef.value} parameter`
          : `Person with key "${keyDef.value}"`,
        properties: personProperties,
      };
    }

    situationProperties.people = {
      type: "object",
      description: "Household members keyed by person ID",
      properties: peopleProperties,
    };
    situationRequired.push("people");
  }

  // Build simpleChecks schema if any keys are defined
  if (config.simpleChecks.length > 0) {
    const simpleChecksProperties: Record<string, JSONSchema7> = {};

    for (const key of config.simpleChecks) {
      simpleChecksProperties[key] = {
        type: "boolean",
        description: `Boolean flag for ${key}`,
      };
    }

    situationProperties.simpleChecks = {
      type: "object",
      description: "Pre-computed boolean checks",
      properties: simpleChecksProperties,
      required: config.simpleChecks,
    };
    situationRequired.push("simpleChecks");
  }

  return {
    type: "object",
    properties: situationProperties,
    required: situationRequired.length > 0 ? situationRequired : undefined,
  };
};

// Build the parameters portion of the schema
const buildParametersSchema = (
  parameters: ParameterSchemaProperty[]
): JSONSchema7 => {
  const properties: Record<string, JSONSchema7> = {};
  const required: string[] = [];

  for (const param of parameters) {
    const typeInfo = parameterTypeToJsonSchemaType(param.type);
    properties[param.key] = {
      ...typeInfo,
      description: param.description,
    } as JSONSchema7;

    if (param.required) {
      required.push(param.key);
    }
  }

  return {
    type: "object",
    description: "Check parameters",
    properties,
    required: required.length > 0 ? required : undefined,
  };
};

// Parse an existing JSON Schema back into editor state
export const parseJsonSchemaToEditorState = (
  schema: JSONSchema7 | undefined | null
): InputSchemaEditorState => {
  if (!schema || typeof schema !== "object") {
    return getDefaultEditorState();
  }

  const state = getDefaultEditorState();

  const properties = schema.properties as Record<string, JSONSchema7> | undefined;
  if (!properties) {
    return state;
  }

  // Parse situation
  const situationSchema = properties.situation as JSONSchema7 | undefined;
  if (situationSchema && typeof situationSchema === "object") {
    const situationProps = situationSchema.properties as Record<string, JSONSchema7> | undefined;

    if (situationProps) {
      // Parse people
      const peopleSchema = situationProps.people as JSONSchema7 | undefined;
      if (peopleSchema && typeof peopleSchema === "object") {
        // Check for explicit properties (new format with specific keys)
        const peopleProps = peopleSchema.properties as Record<string, JSONSchema7> | undefined;
        if (peopleProps) {
          // Parse each person key with its individual properties
          for (const [key, personSchema] of Object.entries(peopleProps)) {
            const isParameterRef = key.startsWith("{") && key.endsWith("}");
            const personProps = (personSchema as JSONSchema7).properties as Record<string, JSONSchema7> | undefined;

            state.situation.people.keys.push({
              value: isParameterRef ? key.slice(1, -1) : key,
              isParameterReference: isParameterRef,
              includeDateOfBirth: personProps ? "dateOfBirth" in personProps : false,
              includeEnrollments: personProps ? "enrollments" in personProps : false,
            });
          }
        }

        // Fallback: check for additionalProperties (old format) - create a generic key
        if (state.situation.people.keys.length === 0) {
          const additionalProps = peopleSchema.additionalProperties as JSONSchema7 | undefined;
          if (additionalProps && typeof additionalProps === "object") {
            const personProps = additionalProps.properties as Record<string, JSONSchema7> | undefined;
            if (personProps) {
              // Old format had shared properties - we can't determine keys, so skip
              // User will need to reconfigure
            }
          }
        }
      }

      // Parse simpleChecks
      const simpleChecksSchema = situationProps.simpleChecks as JSONSchema7 | undefined;
      if (simpleChecksSchema && typeof simpleChecksSchema === "object") {
        const simpleChecksProps = simpleChecksSchema.properties as Record<string, JSONSchema7> | undefined;
        if (simpleChecksProps) {
          state.situation.simpleChecks = Object.keys(simpleChecksProps);
        }
      }
    }
  }

  // Parse parameters
  const parametersSchema = properties.parameters as JSONSchema7 | undefined;
  if (parametersSchema && typeof parametersSchema === "object") {
    const paramProps = parametersSchema.properties as Record<string, JSONSchema7> | undefined;
    const requiredParams = (parametersSchema.required as string[]) || [];

    if (paramProps) {
      state.parameters = Object.entries(paramProps).map(([key, propSchema]) => ({
        key,
        type: jsonSchemaTypeToParameterType(propSchema as JSONSchema7),
        required: requiredParams.includes(key),
        description: (propSchema as JSONSchema7).description,
      }));
    }
  }

  return state;
};

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate editor state before converting to schema
export const validateEditorState = (
  state: InputSchemaEditorState
): ValidationResult => {
  const errors: string[] = [];

  // Get list of defined string parameters (for validating parameter references)
  const stringParameters = new Set(
    state.parameters
      .filter((p) => p.type === "string")
      .map((p) => p.key)
  );

  // Check that at least something is defined
  const keysWithProperties = state.situation.people.keys.filter(
    (k) => k.includeDateOfBirth || k.includeEnrollments
  );
  const hasPeopleConfig = keysWithProperties.length > 0;
  const hasSimpleChecks = state.situation.simpleChecks.length > 0;
  const hasParameters = state.parameters.length > 0;

  if (!hasPeopleConfig && !hasSimpleChecks && !hasParameters) {
    errors.push(
      "At least one situation property (people with properties or simpleChecks) or one parameter must be defined."
    );
  }

  // Validate people keys
  const peopleKeys = new Set<string>();
  for (const keyDef of state.situation.people.keys) {
    if (!keyDef.value || keyDef.value.trim() === "") {
      errors.push("People keys cannot be empty.");
    } else if (keyDef.isParameterReference) {
      // Validate that the referenced parameter exists and is a string type
      if (!stringParameters.has(keyDef.value)) {
        errors.push(
          `People key references parameter "${keyDef.value}" but no string parameter with that name exists.`
        );
      }
    } else {
      // Validate static key format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(keyDef.value)) {
        errors.push(
          `People key "${keyDef.value}" is invalid. Keys must start with a letter and contain only letters, numbers, and underscores.`
        );
      }
    }

    // Validate that each key has at least one property selected
    if (keyDef.value && !keyDef.includeDateOfBirth && !keyDef.includeEnrollments) {
      const displayKey = keyDef.isParameterReference ? `{${keyDef.value}}` : keyDef.value;
      errors.push(
        `People key "${displayKey}" must have at least one property selected (dateOfBirth or enrollments).`
      );
    }

    const keyForDuplicateCheck = keyDef.isParameterReference ? `{${keyDef.value}}` : keyDef.value;
    if (peopleKeys.has(keyForDuplicateCheck)) {
      errors.push(`Duplicate people key: "${keyForDuplicateCheck}".`);
    } else {
      peopleKeys.add(keyForDuplicateCheck);
    }
  }

  // Validate simpleChecks keys
  const simpleCheckKeys = new Set<string>();
  for (const key of state.situation.simpleChecks) {
    if (!key || key.trim() === "") {
      errors.push("Simple check keys cannot be empty.");
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      errors.push(
        `Simple check key "${key}" is invalid. Keys must start with a letter and contain only letters, numbers, and underscores.`
      );
    } else if (simpleCheckKeys.has(key)) {
      errors.push(`Duplicate simple check key: "${key}".`);
    } else {
      simpleCheckKeys.add(key);
    }
  }

  // Validate parameter keys
  const parameterKeys = new Set<string>();
  for (const param of state.parameters) {
    if (!param.key || param.key.trim() === "") {
      errors.push("Parameter keys cannot be empty.");
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(param.key)) {
      errors.push(
        `Parameter key "${param.key}" is invalid. Keys must start with a letter and contain only letters, numbers, and underscores.`
      );
    } else if (parameterKeys.has(param.key)) {
      errors.push(`Duplicate parameter key: "${param.key}".`);
    } else {
      parameterKeys.add(param.key);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
