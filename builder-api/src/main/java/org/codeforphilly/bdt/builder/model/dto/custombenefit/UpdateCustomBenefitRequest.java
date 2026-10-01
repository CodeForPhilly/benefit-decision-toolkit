package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import org.codeforphilly.bdt.builder.api.validation.AtLeastOneProvided;

@AtLeastOneProvided(fields = {"name", "description"})
public class UpdateCustomBenefitRequest {
    public String name;
    public String description;
}
