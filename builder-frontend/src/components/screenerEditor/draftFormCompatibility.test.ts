// @vitest-environment jsdom

import { FormEditor } from "@bpmn-io/form-js-editor";
import { Form } from "@bpmn-io/form-js-viewer";
import { expect, it } from "vitest";
import CustomFormFieldsModule from "./formJsExtensions/customFormFields";

it("imports the draft's generated field types into the real editor and viewer", async () => {
  const editorContainer = document.body.appendChild(
    document.createElement("div"),
  );
  const viewerContainer = document.body.appendChild(
    document.createElement("div"),
  );
  const editor = new FormEditor({
    container: editorContainer,
    additionalModules: [CustomFormFieldsModule],
  });
  const viewer = new Form({
    container: viewerContainer,
    additionalModules: [CustomFormFieldsModule],
  });
  const schema = {
    id: "BDT_Form",
    type: "default",
    schemaVersion: 18,
    exporter: { name: "form-js", version: "1.15.2" },
    components: [
      {
        id: "Field_draft_0",
        key: "simpleChecks.resident",
        label: "Do you live here?",
        type: "yes_no",
      },
      {
        id: "Field_draft_1",
        key: "people.client.enrollments",
        label: "Which benefits do you receive?",
        type: "checklist_none",
        values: [{ label: "Housing assistance", value: "Housing" }],
      },
      {
        id: "Field_draft_2",
        key: "people.client.dateOfBirth",
        label: "Your date of birth",
        type: "datetime",
        subtype: "date",
        dateLabel: "Your date of birth",
      },
      {
        id: "Field_draft_3",
        key: "custom.income",
        label: "Your yearly income",
        type: "number",
      },
      {
        id: "Field_draft_4",
        key: "custom.count",
        label: "How many?",
        type: "number",
        decimalDigits: 0,
      },
      {
        id: "Field_draft_5",
        key: "custom.name",
        label: "Your name",
        type: "textfield",
      },
      {
        id: "Field_draft_6",
        key: "custom.status",
        label: "Your status",
        type: "radio",
        values: [
          { label: "Rent", value: "rent" },
          { label: "Own", value: "own" },
        ],
      },
    ],
  };
  try {
    await editor.importSchema(schema);
    const exported = editor.saveSchema();
    expect(exported.components.map((field: any) => field.key)).toEqual(
      schema.components.map((field) => field.key),
    );
    await viewer.importSchema(exported);
    expect(viewerContainer.textContent).toContain("None of these");
    expect(viewerContainer.querySelectorAll('input[type="radio"]').length).toBe(
      4,
    );
    expect(viewerContainer.textContent).toContain("Your yearly income");
  } finally {
    editor.destroy();
    viewer.destroy();
    document.body.replaceChildren();
  }
});
