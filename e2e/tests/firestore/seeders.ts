import { TEST_USER_ID, TEST_SCREENER_ID, TEST_BENEFIT_ID } from './config';
import { createDocument, createSubcollectionDocument } from './firestoreClient';
import { uploadObject } from './storageClient';
import { getVersion as getLibraryApiVersion } from './libraryApi';

/** Return type for seedScreener - contains the created screener ID */
export interface SeededScreener {
  screenerId: string;
}

/** Return type for seedScreenerWithBenefit - contains screener and benefit IDs */
export interface SeededBenefit {
  screenerId: string;
  benefitId: string;
}

/** Return type for seedScreenerWithConfiguredBenefit - includes the configured check ID */
export interface SeededBenefitWithCheck extends SeededBenefit {
  checkId: string;
}

/** Return type for seedScreenerWithForm - includes the form storage path */
export interface SeededScreenerWithForm extends SeededBenefitWithCheck {
  formPath: string;
}

/**
 * Seeds an empty screener with no benefits.
 * Use when testing screener creation or benefit addition flows.
 * @param name - The screener name (default: "Test Screener")
 * @returns The seeded screener ID
 */
export async function seedScreener(name="Test Screener"): Promise<SeededScreener> {
  await createDocument('workingScreener', TEST_SCREENER_ID, {
    screenerName: name,
    ownerId: TEST_USER_ID,
    benefits: [],
  });

  return { screenerId: TEST_SCREENER_ID };
}

/**
 * Seeds a screener with one benefit that has no eligibility checks configured.
 * Use when testing benefit configuration flows.
 * @param screenerName - The screener name (default: "Test Screener")
 * @param benefitName - The benefit name (default: "Test Benefit")
 * @param benefitDescription - The benefit description (default: "Description")
 * @returns The seeded screener and benefit IDs
 */
export async function seedScreenerWithBenefit(
  screenerName="Test Screener",
  benefitName="Test Benefit",
  benefitDescription="Description"
): Promise<SeededBenefit> {
  // Create screener with benefit detail in the inline array
  await createDocument('workingScreener', TEST_SCREENER_ID, {
    screenerName,
    ownerId: TEST_USER_ID,
    benefits: [
      {
        id: TEST_BENEFIT_ID,
        name: benefitName,
        description: benefitDescription,
      }
    ],
  });

  // Create the full benefit in the subcollection
  await createSubcollectionDocument(
    'workingScreener',
    TEST_SCREENER_ID,
    'customBenefit',
    TEST_BENEFIT_ID,
    {
      id: TEST_BENEFIT_ID,
      ownerId: TEST_USER_ID,
      name: benefitName,
      description: benefitDescription,
      checks: [],
    }
  );

  return { screenerId: TEST_SCREENER_ID, benefitId: TEST_BENEFIT_ID };
}

/**
 * Seeds a screener with a benefit that has the owner-occupant eligibility check configured.
 * Use when testing form creation or preview flows that require a configured check.
 * @param screenerName - The screener name (default: "Test Screener")
 * @param benefitName - The benefit name (default: "Test Benefit")
 * @param benefitDescription - The benefit description (default: "Description")
 * @returns The seeded screener, benefit, and check IDs
 */
export async function seedScreenerWithConfiguredBenefit(
  screenerName="Test Screener",
  benefitName="Test Benefit",
  benefitDescription="Description"
): Promise<SeededBenefitWithCheck> {
  const libraryVersion = await getLibraryApiVersion();
  const checkId = `L-residence-owner-occupant-${libraryVersion}`;

  // Create screener with benefit detail
  await createDocument('workingScreener', TEST_SCREENER_ID, {
    screenerName,
    ownerId: TEST_USER_ID,
    benefits: [
      {
        id: TEST_BENEFIT_ID,
        name: benefitName,
        description: benefitDescription,
      }
    ],
  });

  // Create benefit with the owner-occupant check configured
  await createSubcollectionDocument(
    'workingScreener',
    TEST_SCREENER_ID,
    'customBenefit',
    TEST_BENEFIT_ID,
    {
      id: TEST_BENEFIT_ID,
      ownerId: TEST_USER_ID,
      name: benefitName,
      description: benefitDescription,
      checks: [
        {
          checkId,
          checkName: "owner-occupant",
          checkVersion: libraryVersion,
          checkModule: "residence",
          evaluationUrl: "/api/v1/checks/residence/owner-occupant",
          inputDefinition: {
            type: "object",
            properties: {
              simpleChecks: {
                type: "object",
                properties: {
                  ownerOccupant: { type: "boolean" }
                }
              }
            }
          },
          parameterDefinitions: [],
          parameters: {},
        }
      ],
    }
  );

  return { screenerId: TEST_SCREENER_ID, benefitId: TEST_BENEFIT_ID, checkId };
}

/**
 * Seeds a complete screener with benefit, eligibility check, and form schema.
 * The screener is ready for preview or publish testing.
 * @param screenerName - The screener name (default: "Test Screener")
 * @param benefitName - The benefit name (default: "Test Benefit")
 * @param benefitDescription - The benefit description (default: "Description")
 * @returns The seeded screener, benefit, check IDs, and form storage path
 */
export async function seedScreenerWithForm(
  screenerName="Test Screener",
  benefitName="Test Benefit",
  benefitDescription="Description"
): Promise<SeededScreenerWithForm> {
  const { screenerId, benefitId, checkId } = await seedScreenerWithConfiguredBenefit(
    screenerName,
    benefitName,
    benefitDescription
  );

  // Form schema with a checkbox bound to simpleChecks.ownerOccupant
  const formSchema = {
    schemaVersion: 18,
    exporter: {
      name: "@bpmn-io/form-js",
      version: "1.11.1"
    },
    components: [
      {
        label: "Is owner occupant?",
        type: "checkbox",
        id: "Checkbox_1",
        key: "simpleChecks.ownerOccupant"
      }
    ],
    type: "default",
    id: "BDT Form"
  };

  const formPath = `form/working/${TEST_SCREENER_ID}.json`;
  await uploadObject(formPath, JSON.stringify(formSchema));

  return { screenerId, benefitId, checkId, formPath };
}
