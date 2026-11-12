package org.codeforphilly.bdt.library.api;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class ReferenceOpenApiTest {

    private static final String LIHEAP = "paths.'/api/v1/benefits/pa/liheap-cash'.post";
    private static final String POVERTY = "paths.'/api/v1/checks/income/household-income-within-poverty-guidelines'.post";

    private JsonPath openApi;

    @BeforeEach
    void loadOpenApi() {
        openApi = given().queryParam("format", "JSON").get("/q/openapi")
            .then().statusCode(200).extract().jsonPath();
    }

    @Test
    void benefitReferenceIncludesSummaryCheckRationaleAndImplementationNotes() {
        Map<String, Object> reference = openApi.getMap(LIHEAP + ".'x-bdt-reference'");
        assertNotNull(reference, "PA LIHEAP Cash should publish its reference");

        assertTrue(openApi.getString(LIHEAP + ".description").startsWith((String) reference.get("summary")));
        assertEquals("2026-11-02", openApi.getString(LIHEAP + ".'x-bdt-reference'.programYear.startDate"));
        assertEquals("2027-04-23", openApi.getString(LIHEAP + ".'x-bdt-reference'.programYear.endDate"));
        assertEquals("https://www.pa.gov/agencies/dhs/resources/liheap",
            openApi.getString(LIHEAP + ".'x-bdt-reference'.administeredBy.url"));
        assertTrue(openApi.getList(LIHEAP + ".'x-bdt-reference'.limitations").size() >= 6);

        List<Map<String, Object>> checks = openApi.getList(LIHEAP + ".'x-bdt-reference'.checks");
        assertEquals(List.of("LivesInPennsylvania", "IncomeAtOrBelow150PercentFpl", "PaysPrimaryHeatingCosts",
            "HasCitizenOrEligibleNoncitizen", "NotAlreadyEnrolled"), checks.stream().map(c -> c.get("alias")).toList());
        assertEquals("PersonNotEnrolledInBenefitService", checks.get(4).get("operationId"));
        assertTrue(((String) checks.get(4).get("rationale")).contains("one Cash grant per season"));

        List<Map<String, Object>> notes = openApi.getList(LIHEAP + ".'x-bdt-reference'.implementationNotes");
        assertEquals(2, notes.size());
        assertEquals("checks", notes.get(0).get("decision"));
        assertTrue(((String) notes.get(0).get("text")).contains("issues/568"));
    }

    @Test
    void checkReferenceDescribesItsParameters() {
        List<Map<String, Object>> parameters = openApi.getList(POVERTY + ".'x-bdt-reference'.parameters");
        assertEquals(List.of("percent", "guidelineYear"), parameters.stream().map(p -> p.get("name")).toList());
        assertEquals("number", parameters.get(0).get("type"));
        assertTrue(((String) parameters.get(1).get("description")).contains("HHS poverty guidelines"));
        assertNull(openApi.get(POVERTY + ".'x-bdt-reference'.administeredBy"));
    }

    @Test
    void swaggerUiShowsTheReferenceAsMarkdownAndLinksToTheDocs() {
        String description = openApi.getString(LIHEAP + ".description");
        assertTrue(description.contains("## Checks"), description);
        assertTrue(description.contains("- **Not already enrolled**: "), description);
        assertTrue(description.contains("## Limitations"), description);
        assertTrue(description.contains("[Pennsylvania DHS: LIHEAP](https://www.pa.gov/agencies/dhs/resources/liheap)"),
            description);
        assertTrue(description.contains("HSEA 1 LIHEAP application: Revised 6/26 (checked November 12, 2026)"),
            description);
        assertFalse(description.contains("issues/568"), "implementation notes stay out of the API description");

        assertEquals("https://bdt-docs.web.app/library/benefits/pa/liheap-cash/",
            openApi.getString(LIHEAP + ".externalDocs.url"));
    }

    @Test
    void parameterDescriptionsAppearOnTheParametersSchema() {
        String schemaRef = openApi.getString(POVERTY + ".requestBody.content.'application/json'.schema.$ref");
        String inputSchema = schemaRef.substring("#/components/schemas/".length());
        String parametersRef = openApi.getString("components.schemas." + inputSchema + ".properties.parameters.$ref");
        String parametersSchema = parametersRef.substring("#/components/schemas/".length());
        assertTrue(openApi.getString("components.schemas." + parametersSchema + ".properties.guidelineYear.description")
            .contains("HHS poverty guidelines"));
    }

    @Test
    void modelsWithoutAReferenceDecisionPublishNone() {
        assertNull(openApi.get("paths.'/api/v1/benefits/pa/phl/homestead-exemption'.post.'x-bdt-reference'"));
    }

    @Test
    void brunoTestsWithADocsBlockBecomeExamples() {
        String examples = LIHEAP + ".requestBody.content.'application/json'.examples";
        Map<String, Map<String, Object>> byName = openApi.getMap(examples);
        assertFalse(byName.containsKey("Smoke Test"), "Bruno tests without a docs block are not examples");
        assertFalse(byName.containsKey("Example request"), "Bruno examples replace the generated example");

        Map<String, Object> eligible = byName.get("Eligible");
        assertNotNull(eligible, "examples: " + byName.keySet());
        assertFalse(((String) eligible.get("description")).isBlank());
        assertEquals(Map.of("isEligible", true), eligible.get("x-bdt-expected"));
        assertEquals("p1", openApi.getString(examples + ".Eligible.value.situation.primaryPersonId"));
        assertEquals(23940, openApi.getInt(examples + ".Eligible.value.situation.householdIncome"));
    }
}
