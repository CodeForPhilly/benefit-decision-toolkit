package org.acme.model.dto;

import org.acme.model.domain.ParameterDefinition;
import java.util.List;

public class UpdateCheckRequest {
    public String description;
    public List<ParameterDefinition> parameterDefinitions;
}
