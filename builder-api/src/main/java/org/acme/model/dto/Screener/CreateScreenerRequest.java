package org.acme.model.dto.Screener;

import jakarta.validation.constraints.NotBlank;

public record CreateScreenerRequest(
        @NotBlank(message = "screenerName must be provided.") String screenerName,
        String description) {
}