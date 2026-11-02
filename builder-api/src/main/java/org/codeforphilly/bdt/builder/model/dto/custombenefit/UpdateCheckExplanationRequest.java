package org.codeforphilly.bdt.builder.model.dto.custombenefit;

import jakarta.validation.constraints.Size;

public record UpdateCheckExplanationRequest(@Size(max = 2000) String explanation) {}
