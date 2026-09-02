package org.acme.model.dto.EligibilityCheck;

import org.acme.api.validation.ValidCheckName;
import org.acme.model.domain.ParameterDefinition;
import java.util.List;

public record CreateCheckRequest(
    @ValidCheckName String name,
    String module,
    String description,
    List<ParameterDefinition> parameterDefinitions
) {}
