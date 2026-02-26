## EligibilityCheck InputDefinitions

Each EligibilityCheck defines a JSON Schema for that data it takes as inputs. This JSON Schema is located at `EligibilityCheck.inputDefinition`, and when a Check is added to a Benefit this JSON Schema is copied to `CheckConfig.inputDefinition`.

Example `EligibilityCheck.inputDefinition` JSON Schema for `Person-min-age` (as of 2026-02-25):
```
{
  "type": "object",
  "properties": {
    "people": {
      "type": "array",
      "items": {
  		"type": "object",
        "properties": {
          "dateOfBirth": {
            "type": "string",
            "format": "date"
          },
          "id": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

Example Data that would be accepted by `EligibilityCheck.inputDefinition` JSON Schema (as of 2026-02-25):
```
{
  "people": [
    {
      "id": "client",
      "dateOfBirth": "1960-01-01"
    },
    {
      "id": "spouse",
      "dateOfBirth": "1984-01-01"
    }
  ]
}
```

## The reason for a transformation layer

This JSON Schema existing makes it easy to validate the data being sent to an EligibilityCheck (library or custom). However, forcing the Screener Form to produce data that conforms to this Schema leads to a poor user experience.

After some deliberation, the Tech team of BDT decided that the following format would be more suited to the user experience of building a form:
```
{
  "people": {
    "client": {
      "dateOfBirth": "1960-01-01"
    },
    "spouse": {
      "dateOfBirth": "1984-01-01"
    }
  }
}
```

If this was the data the Screener Form was expected to produce, then we could have the user choose between the following options when building their form: `["people.client.dateOfBirth", "people.spouse.dateOfBirth"]`

## The transformation Layer

As of 2026-02-25, the Data Transformation Layer has two parts.
- The endpoint `/screener/{screenerId}/form-paths` was made.
  - This endpoint loops over each Benefit in the selected Screener, then loops over each Check selected in those benefits, and transforms the InputDefinitions of those checks into JSON Schemas that match the desired data (`transformInputDefinitionSchema`).
  - Then once the JSON Schema has been created for a check, the "FormPaths" are extracted from that new JSON Schema (`extractJsonSchemaPaths`).
  - These "FormPath" objects are returned to the Frontend.
- A step was added to Decision Endpoints to transform the Form Data into a state that matched what the EligibilityChecks expect (`FormDataTransformer.transformFormData`).

## Potential weaknesses of this approach

- `InputSchemaService` and `FormDataTransformer` are two different classes in the backend. They are related, but because one of these operates on JSON Schema definitions and the other operates on actual Form Data it is difficult to determine the boundaries of these services.
- The preferred schema of the Form Data for user experience is known only by the devs and/or by looking at what the transformations do. Some definition of what this "preferred schema" actually is could be added to the codebase.
- The old method of having the form output match what the EligibilityCheck expected made it simple for devs to know what the output of the form needed to be in order to satisfy the checks. This may also be solved by documenting this preferred form-data schema.
