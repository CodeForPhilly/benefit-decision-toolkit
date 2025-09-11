import { Screener, ResultDetail } from "./types";


// Simulate fetching screener data
export const detachedFetchScreener = async (screenerId: string): Promise<Screener> => {
  return new Promise((resolve, reject) => {
    resolve(testScreener);
  });
};

// Simulate decision logic based on form data
export const detachedGetDecision = async (screenerId: string, data: any): Promise<ResultDetail[]> => {
  const age = data.age || 0;
  const greaterThan50 = age > 50;
  const testResults: ResultDetail[] = [
    {
      ...testBenefit,
      result: greaterThan50,
      checks: [
        { ...testBenefitCheck, result: greaterThan50 }
      ],
    }
  ]
  return new Promise((resolve, reject) => {
    resolve(testResults);
  });
};


// Example screener data
const testScreener: Screener = {
  id: "1",
  formSchema: {
    "components": [
      {
        "text": "# Benefits Form.",
        "type": "text",
        "id": "Field_1ak5xiv",
        "layout": {
          "row": "Row_106kztn"
        }
      },
      {
        "label": "Age",
        "key": "age",
        "type": "textfield",
        "validate": {
          "required": true
        },
        "id": "Field_0099nva",
        "layout": {
          "row": "Row_0g867nn"
        }
      },
      {
        "label": "Submit",
        "action": "submit",
        "key": "submit",
        "type": "button",
        "id": "Field_0avadh4",
        "layout": {
          "row": "Row_1l141dg"
        }
      }
    ],
    "schemaVersion": 18,
    "exporter": {
      "name": "form-js (https://demo.bpmn.io)",
      "version": "1.15.0"
    },
    "type": "default",
    "id": "Form_1xvi9hj"
  }
}

// Example decision results
const testBenefit: ResultDetail = {
  displayName: "Benefit A",
  result: true,
  info: "You are eligible for Benefit A.",
  appLink: "http://example.com/apply-benefit-a",
  checks: []
};
const testBenefitCheck: ResultDetail = {
  displayName: "Over 50 Years Old",
  result: true,
  info: "",
  appLink: "",
  checks: [],
};
