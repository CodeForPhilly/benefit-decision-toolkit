package org.codeforphilly.bdt.builder.model.dto.eligibilitycheck;

import org.codeforphilly.bdt.builder.api.validation.AtLeastOneProvided;
import org.codeforphilly.bdt.builder.api.validation.ValidCheckName;
import org.codeforphilly.bdt.builder.model.domain.ParameterDefinition;
import java.util.List;


@AtLeastOneProvided(fields = {"name", "description", "parameterDefinitions"})
public record EditCheckRequest(
    @ValidCheckName(optional = true) String name, String description, List<ParameterDefinition> parameterDefinitions,
    String dmnModel, String originalDmnModel
) {}
