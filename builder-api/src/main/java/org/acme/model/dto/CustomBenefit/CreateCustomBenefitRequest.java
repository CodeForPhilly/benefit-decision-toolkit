package org.acme.model.dto.CustomBenefit;

import jakarta.validation.constraints.NotBlank;

public record CreateCustomBenefitRequest(
    @NotBlank(message = "Custom Benefit name must be provided.") String name,
    String description
) {}
