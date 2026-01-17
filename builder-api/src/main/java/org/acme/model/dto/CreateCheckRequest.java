package org.acme.model.dto;

import org.acme.model.domain.ParameterDefinition;
import java.util.List;

public class CreateCheckRequest {
    public String name;
    public String module;
    public String description;
    public List<ParameterDefinition> parameterDefinitions;
}
