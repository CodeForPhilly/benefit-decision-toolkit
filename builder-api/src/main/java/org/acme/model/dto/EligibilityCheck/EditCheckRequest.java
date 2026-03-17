package org.acme.model.dto.EligibilityCheck;

import com.fasterxml.jackson.databind.JsonNode;
import org.acme.api.validation.AtLeastOneProvided;
import org.acme.model.domain.ParameterDefinition;
import java.util.List;


@AtLeastOneProvided(fields = {"description", "parameterDefinitions", "inputDefinition"})
public record EditCheckRequest(
    String description,
    List<ParameterDefinition> parameterDefinitions,
    JsonNode inputDefinition
) {}
