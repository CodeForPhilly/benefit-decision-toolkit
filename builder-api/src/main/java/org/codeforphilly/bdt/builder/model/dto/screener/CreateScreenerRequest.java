package org.codeforphilly.bdt.builder.model.dto.screener;

import jakarta.validation.constraints.NotBlank;

public record CreateScreenerRequest(
        @NotBlank(message = "screenerName must be provided.") String screenerName,
        String description) {
}