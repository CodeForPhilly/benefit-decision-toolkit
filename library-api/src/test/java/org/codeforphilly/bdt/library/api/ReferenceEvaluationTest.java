package org.codeforphilly.bdt.library.api;

import org.junit.jupiter.api.Test;
import org.kie.dmn.api.core.DMNRuntime;
import org.kie.dmn.core.internal.utils.DMNRuntimeBuilder;
import org.kie.internal.io.ResourceFactory;

import java.io.StringReader;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ReferenceEvaluationTest {

    private static final String BENEFIT_REFERENCE = """
        {
          explanation: "Helps with heating bills.",
          administeredBy: {name: "PA DHS", url: "https://www.pa.gov/agencies/dhs"},
          programYear: {label: "2026-27", startDate: date("2026-11-02"), endDate: date("2027-04-23")},
          sources: [{title: "State Plan", url: "https://example.gov/plan.pdf", citation: "601.81", checkedOn: date("2026-11-12")}],
          limitations: ["Household size is taken as given."],
          lastReviewed: date("2026-11-12")
        }
        """;

    @Test
    void benefitReferenceBecomesPlainJsonWithIsoDates() {
        Map<String, Object> reference = evaluate(Reference.Kind.BENEFIT, "", BENEFIT_REFERENCE);

        assertEquals(List.of("explanation", "administeredBy", "programYear", "sources", "limitations", "lastReviewed"),
            List.copyOf(reference.keySet()));
        assertEquals("2026-11-12", reference.get("lastReviewed"));
        assertEquals(Map.of("label", "2026-27", "startDate", "2026-11-02", "endDate", "2027-04-23"),
            reference.get("programYear"));
        assertEquals(List.of(Map.of("title", "State Plan", "url", "https://example.gov/plan.pdf",
            "citation", "601.81", "checkedOn", "2026-11-12")), reference.get("sources"));
        assertEquals(List.of("Household size is taken as given."), reference.get("limitations"));
    }

    @Test
    void programYearIsOptional() {
        Map<String, Object> reference = evaluate(Reference.Kind.BENEFIT, "",
            BENEFIT_REFERENCE.replaceFirst("programYear: \\{[^}]*},", ""));
        assertFalse(reference.containsKey("programYear"));
    }

    @Test
    void modelsWithoutAReferenceHaveNone() {
        DMNRuntime runtime = runtime("""
            <decision id="other" name="other">
              <variable name="other" typeRef="string"/>
              <literalExpression><text>"x"</text></literalExpression>
            </decision>
            """);
        assertTrue(Reference.evaluate(runtime, runtime.getModels().getFirst(), Reference.Kind.CHECK).isEmpty());
    }

    @Test
    void refusesAReferenceMissingARequiredField() {
        var error = assertThrows(Reference.InvalidReferenceException.class, () -> evaluate(Reference.Kind.BENEFIT, "",
            BENEFIT_REFERENCE.replace("lastReviewed: date(\"2026-11-12\")", "lastReviewed: null")));
        assertTrue(error.getMessage().contains("lastReviewed"), error.getMessage());
    }

    @Test
    void refusesBenefitOnlyFieldsOnACheck() {
        var error = assertThrows(Reference.InvalidReferenceException.class,
            () -> evaluate(Reference.Kind.CHECK, "", BENEFIT_REFERENCE));
        assertTrue(error.getMessage().contains("administeredBy"), error.getMessage());
    }

    @Test
    void refusesSourcesWithoutAnHttpsUrl() {
        var error = assertThrows(Reference.InvalidReferenceException.class, () -> evaluate(Reference.Kind.BENEFIT, "",
            BENEFIT_REFERENCE.replace("https://example.gov/plan.pdf", "example.gov/plan.pdf")));
        assertTrue(error.getMessage().contains("url"), error.getMessage());
    }

    @Test
    void refusesAReferenceThatDependsOnAnswers() {
        var error = assertThrows(Reference.InvalidReferenceException.class, () -> evaluate(Reference.Kind.BENEFIT,
            "<informationRequirement><requiredInput href=\"#situation\"/></informationRequirement>", BENEFIT_REFERENCE));
        assertTrue(error.getMessage().contains("no information requirements"), error.getMessage());
    }

    private Map<String, Object> evaluate(Reference.Kind kind, String requirements, String expression) {
        DMNRuntime runtime = runtime("""
            <decision id="reference" name="reference">
              <variable name="reference" typeRef="Any"/>
              %s
              <literalExpression><text>%s</text></literalExpression>
            </decision>
            """.formatted(requirements, expression));
        return Reference.evaluate(runtime, runtime.getModels().getFirst(), kind);
    }

    private DMNRuntime runtime(String decision) {
        String xml = """
            <definitions xmlns="https://www.omg.org/spec/DMN/20240513/MODEL/"
                         id="test" name="ReferenceTest" namespace="https://bdt.test/reference">
              <inputData id="situation" name="situation">
                <variable name="situation" typeRef="string"/>
              </inputData>
              %s
            </definitions>
            """.formatted(decision);
        return DMNRuntimeBuilder.fromDefaults().buildConfiguration()
            .fromResources(List.of(ResourceFactory.newReaderResource(new StringReader(xml))))
            .getOrElseThrow(error -> new IllegalStateException("Could not compile test DMN", error));
    }
}
