package org.acme.model.dto.EligibilityCheck;

import org.acme.api.validation.AtLeastOneProvided;
import org.acme.api.validation.ValidCheckName;
import org.acme.model.domain.ParameterDefinition;
import java.util.List;


@AtLeastOneProvided(fields = {"name", "description", "parameterDefinitions"})
public record EditCheckRequest(
    @ValidCheckName(optional = true) String name, String description, List<ParameterDefinition> parameterDefinitions,
    String dmnModel, String originalDmnModel
) {}
