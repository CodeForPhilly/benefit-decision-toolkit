package org.acme.model.dto.EligibilityCheck;

import org.acme.api.validation.AtLeastOneProvided;
import org.acme.model.domain.ParameterDefinition;
import java.util.List;


@AtLeastOneProvided(fields = {"description", "parameterDefinitions"})
public record EditCheckRequest(
    String description, List<ParameterDefinition> parameterDefinitions
) {}
