package org.acme.model.dto.EligibilityCheck;

import org.acme.model.domain.ParameterDefinition;
import java.util.List;

public record CreateCheckRequest(
    String name,
    String module,
    String description,
    List<ParameterDefinition> parameterDefinitions
) {}
