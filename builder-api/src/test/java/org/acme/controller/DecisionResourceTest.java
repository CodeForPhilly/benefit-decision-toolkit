package org.acme.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.Response;
import org.acme.enums.EvaluationResult;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.Screener;
import org.acme.persistence.PublishedScreenerRepository;
import org.acme.persistence.StorageService;
import org.acme.service.DmnService;
import org.acme.service.InputSchemaService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DecisionResourceTest {

    @Test
    @SuppressWarnings("unchecked")
    void evaluatePublishedScreener_includesEachChecksQuestionVotes() throws Exception {
        PublishedScreenerRepository repository = mock(PublishedScreenerRepository.class);
        StorageService storageService = mock(StorageService.class);
        DmnService dmnService = mock(DmnService.class);
        DecisionResource resource = new DecisionResource();
        resource.publishedScreenerRepository = repository;
        resource.storageService = storageService;
        resource.dmnService = dmnService;
        resource.inputSchemaService = new InputSchemaService();

        CheckConfig check = new CheckConfig();
        check.setCheckId("income-check");
        check.setCheckName("IncomeCheck");
        check.setParameters(Map.of());
        check.setInputDefinition(new ObjectMapper().readTree("""
            {
                "type": "object",
                "properties": {
                    "custom": {
                        "type": "object",
                        "properties": {
                            "householdIncome": { "type": "number" }
                        }
                    }
                }
            }
            """));

        Screener screener = new Screener();
        Benefit benefit = new Benefit("benefit-1", "Benefit", "", "owner", List.of(check));
        when(repository.getScreener("published-1")).thenReturn(Optional.of(screener));
        when(repository.getBenefitsInScreener(screener)).thenReturn(List.of(benefit));
        when(storageService.getCheckDmnModelPath("income-check")).thenReturn("income-check.dmn");
        when(dmnService.evaluateDmn(
            eq("income-check.dmn"),
            eq("IncomeCheck"),
            any(),
            eq(Map.of())
        )).thenReturn(EvaluationResult.TRUE);

        Response response = resource.evaluatePublishedScreener(
            "published-1",
            Map.of("custom", Map.of("householdIncome", 12_000))
        );

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        Map<String, Object> screenerResults = (Map<String, Object>) response.getEntity();
        Map<String, Object> benefitResult = (Map<String, Object>) screenerResults.get("benefit-1");
        Map<String, Object> checkResults = (Map<String, Object>) benefitResult.get("check_results");
        Map<String, Object> checkResult = (Map<String, Object>) checkResults.get("income-check0");
        assertEquals(List.of("custom.householdIncome"), checkResult.get("inputPaths"));
    }
}
