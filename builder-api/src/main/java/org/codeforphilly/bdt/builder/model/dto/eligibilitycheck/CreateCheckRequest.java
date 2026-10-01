package org.codeforphilly.bdt.builder.model.dto.eligibilitycheck;

import org.codeforphilly.bdt.builder.api.validation.ValidCheckName;
import org.codeforphilly.bdt.builder.model.domain.ParameterDefinition;
import java.util.List;

public record CreateCheckRequest(
    @ValidCheckName String name,
    String module,
    String description,
    List<ParameterDefinition> parameterDefinitions
) {}
