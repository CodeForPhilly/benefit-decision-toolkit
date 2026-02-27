package org.acme.model.dto.CustomBenefit;

import org.acme.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"name", "description"})
public class UpdateCustomBenefitRequest {
    public String name;
    public String description;
}
