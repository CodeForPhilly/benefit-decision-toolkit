package org.acme.controller;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.core.Response;
import org.acme.model.domain.Benefit;
import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.EligibilityCheck;
import org.acme.model.domain.ParameterDefinition;
import org.acme.model.domain.Screener;
import org.acme.model.dto.CustomBenefit.AddCheckRequest;
import org.acme.persistence.EligibilityCheckRepository;
import org.acme.persistence.ScreenerRepository;
import org.acme.service.EligibilityCheckAliasService;
import org.acme.service.LibraryApiService;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomBenefitResourceTest {
    private static final String USER_ID = "analyst-1";
    private static final String SCREENER_ID = "screener-1";
    private static final String BENEFIT_ID = "benefit-1";

    private final ScreenerRepository screenerRepository = mock(ScreenerRepository.class);
    private final EligibilityCheckRepository checkRepository = mock(EligibilityCheckRepository.class);
    private final LibraryApiService libraryApiService = mock(LibraryApiService.class);
    private final EligibilityCheckAliasService aliasService = mock(EligibilityCheckAliasService.class);
    private final SecurityIdentity identity = mock(SecurityIdentity.class);
    private final CustomBenefitResource resource = new CustomBenefitResource();

    @BeforeEach
    void setUp() {
        resource.screenerRepository = screenerRepository;
        resource.eligibilityCheckRepository = checkRepository;
        resource.libraryApiMetadataService = libraryApiService;
        resource.eligibilityCheckAliasService = aliasService;

        JsonWebToken token = mock(JsonWebToken.class);
        when(identity.getPrincipal()).thenReturn(token);
        when(token.getClaim("user_id")).thenReturn(USER_ID);

        Screener screener = new Screener();
        screener.setOwnerId(USER_ID);
        when(screenerRepository.getWorkingScreenerMetaDataOnly(SCREENER_ID))
            .thenReturn(Optional.of(screener));
    }

    @Test
    void addCheckStoresParametersAndAnAutomaticallyGeneratedAlias() throws Exception {
        Benefit benefit = new Benefit(BENEFIT_ID, "Benefit", "", USER_ID, new ArrayList<>());
        EligibilityCheck check = new EligibilityCheck();
        check.setId("published-check");
        check.setName("PersonNotEnrolledInBenefit");
        check.setModule("enrollment");
        check.setVersion("1.0.0");
        check.setParameterDefinitions(List.of());
        Map<String, Object> parameters = Map.of(
            "personId", "client",
            "benefit", "PhlHomesteadExemption"
        );

        when(screenerRepository.getCustomBenefit(SCREENER_ID, BENEFIT_ID)).thenReturn(Optional.of(benefit));
        when(checkRepository.getPublishedCustomCheck(USER_ID, "published-check")).thenReturn(Optional.of(check));
        when(aliasService.generate(check.getName(), parameters))
            .thenReturn("Client not already enrolled in Homestead Exemption");

        Response response = resource.addCheckToBenefit(
            identity,
            SCREENER_ID,
            BENEFIT_ID,
            new AddCheckRequest("published-check", parameters)
        );

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        ArgumentCaptor<Benefit> benefitCaptor = ArgumentCaptor.forClass(Benefit.class);
        verify(screenerRepository).updateCustomBenefit(
            org.mockito.ArgumentMatchers.eq(SCREENER_ID),
            benefitCaptor.capture()
        );
        CheckConfig savedCheck = benefitCaptor.getValue().getChecks().getFirst();
        assertEquals(parameters, savedCheck.getParameters());
        assertEquals("Client not already enrolled in Homestead Exemption", savedCheck.getAliasName());
    }

    @Test
    @SuppressWarnings("unchecked")
    void generateCheckAliasReturnsAPreviewWithoutOverwritingManualAlias() throws Exception {
        CheckConfig check = new CheckConfig();
        check.setCheckId("configured-check");
        check.setCheckName("IncomeThreshold");
        check.setParameters(Map.of("limit", 50_000));
        check.setAliasName("Manual alias");
        Benefit benefit = new Benefit(BENEFIT_ID, "Benefit", "", USER_ID, List.of(check));

        when(screenerRepository.getCustomBenefit(SCREENER_ID, BENEFIT_ID)).thenReturn(Optional.of(benefit));
        when(aliasService.generate("IncomeThreshold", check.getParameters())).thenReturn("Income under $50,000");

        Response response = resource.generateCheckAlias(identity, SCREENER_ID, BENEFIT_ID, "configured-check");

        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertEquals("Income under $50,000", ((Map<String, String>) response.getEntity()).get("aliasName"));
        assertEquals("Manual alias", check.getAliasName());
        verify(screenerRepository, never()).updateCustomBenefit(any(), any());
    }

    @Test
    void addCheckRejectsMissingRequiredParameters() throws Exception {
        Benefit benefit = new Benefit(BENEFIT_ID, "Benefit", "", USER_ID, new ArrayList<>());
        EligibilityCheck check = new EligibilityCheck();
        check.setId("published-check");
        check.setName("IncomeThreshold");
        ParameterDefinition limit = new ParameterDefinition();
        limit.setKey("limit");
        limit.setType("number");
        limit.setRequired(true);
        check.setParameterDefinitions(List.of(limit));

        when(screenerRepository.getCustomBenefit(SCREENER_ID, BENEFIT_ID)).thenReturn(Optional.of(benefit));
        when(checkRepository.getPublishedCustomCheck(USER_ID, "published-check")).thenReturn(Optional.of(check));

        Response response = resource.addCheckToBenefit(
            identity,
            SCREENER_ID,
            BENEFIT_ID,
            new AddCheckRequest("published-check", Map.of())
        );

        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        verify(aliasService, never()).generate(any(), any());
        verify(screenerRepository, never()).updateCustomBenefit(any(), any());
    }
}
