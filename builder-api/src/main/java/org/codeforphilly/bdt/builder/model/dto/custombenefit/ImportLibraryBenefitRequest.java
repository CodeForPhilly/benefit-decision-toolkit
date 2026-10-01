package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import jakarta.validation.constraints.NotBlank;

public record ImportLibraryBenefitRequest(
    @NotBlank(message = "Library Benefit id must be provided.") String benefitId
) {}
