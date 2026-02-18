package org.acme.model.dto;

import java.util.List;

/**
 * Response DTO for the form paths endpoint.
 * Contains the list of unique input paths required by all checks in a screener,
 * along with their JSON Schema types for type-aware form field binding.
 */
public class FormPathsResponse {
    private List<FormPath> paths;

    public FormPathsResponse() {
    }

    public FormPathsResponse(List<FormPath> paths) {
        this.paths = paths;
    }

    public List<FormPath> getPaths() {
        return paths;
    }

    public void setPaths(List<FormPath> paths) {
        this.paths = paths;
    }
}
