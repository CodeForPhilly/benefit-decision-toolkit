package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import jakarta.validation.constraints.NotBlank;

public record CreateCustomBenefitRequest(
    @NotBlank(message = "Custom Benefit name must be provided.") String name,
    String description
) {}
