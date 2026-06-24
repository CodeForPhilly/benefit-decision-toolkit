package org.acme.service;

import org.acme.model.domain.CheckConfig;
import org.acme.model.domain.ParameterDefinition;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class LibraryApiServiceTest {

    @Test
    void buildEffectiveParameters_defaultsMissingAsOfDateWhenDeclared() {
        LibraryApiService service = new LibraryApiService();
        CheckConfig checkConfig = checkConfigWithParameters(Map.of("minAge", 65), asOfDateParameter());

        LibraryApiService.EffectiveParameters result = service.buildEffectiveParameters(checkConfig);

        assertEquals(LocalDate.now().toString(), result.parameters().get("asOfDate"));
        assertEquals(List.of("asOfDate"), result.defaultedParameters());
        assertFalse(checkConfig.getParameters().containsKey("asOfDate"));
    }

    @Test
    void buildEffectiveParameters_defaultsBlankAsOfDateWhenDeclared() {
        LibraryApiService service = new LibraryApiService();
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("asOfDate", " ");
        parameters.put("minAge", 65);
        CheckConfig checkConfig = checkConfigWithParameters(parameters, asOfDateParameter());

        LibraryApiService.EffectiveParameters result = service.buildEffectiveParameters(checkConfig);

        assertEquals(LocalDate.now().toString(), result.parameters().get("asOfDate"));
        assertEquals(List.of("asOfDate"), result.defaultedParameters());
        assertEquals(" ", checkConfig.getParameters().get("asOfDate"));
    }

    @Test
    void buildEffectiveParameters_keepsExplicitAsOfDate() {
        LibraryApiService service = new LibraryApiService();
        CheckConfig checkConfig = checkConfigWithParameters(
            Map.of("asOfDate", "2025-12-31", "minAge", 65),
            asOfDateParameter()
        );

        LibraryApiService.EffectiveParameters result = service.buildEffectiveParameters(checkConfig);

        assertEquals("2025-12-31", result.parameters().get("asOfDate"));
        assertTrue(result.defaultedParameters().isEmpty());
    }

    @Test
    void buildEffectiveParameters_doesNotDefaultWhenAsOfDateIsNotDeclared() {
        LibraryApiService service = new LibraryApiService();
        CheckConfig checkConfig = checkConfigWithParameters(Map.of("minAge", 65), minAgeParameter());

        LibraryApiService.EffectiveParameters result = service.buildEffectiveParameters(checkConfig);

        assertFalse(result.parameters().containsKey("asOfDate"));
        assertTrue(result.defaultedParameters().isEmpty());
    }

    @Test
    void buildEffectiveParameters_returnsMutableCopy() {
        LibraryApiService service = new LibraryApiService();
        Map<String, Object> parameters = Map.of("minAge", 65);
        CheckConfig checkConfig = checkConfigWithParameters(parameters, minAgeParameter());

        LibraryApiService.EffectiveParameters result = service.buildEffectiveParameters(checkConfig);

        assertNotSame(parameters, result.parameters());
    }

    private CheckConfig checkConfigWithParameters(
        Map<String, Object> parameters,
        ParameterDefinition parameterDefinition
    ) {
        CheckConfig checkConfig = new CheckConfig();
        checkConfig.setParameters(parameters);
        checkConfig.setParameterDefinitions(List.of(parameterDefinition));
        return checkConfig;
    }

    private ParameterDefinition asOfDateParameter() {
        ParameterDefinition parameterDefinition = new ParameterDefinition();
        parameterDefinition.setKey("asOfDate");
        parameterDefinition.setType("date");
        return parameterDefinition;
    }

    private ParameterDefinition minAgeParameter() {
        ParameterDefinition parameterDefinition = new ParameterDefinition();
        parameterDefinition.setKey("minAge");
        parameterDefinition.setType("number");
        return parameterDefinition;
    }
}
