package org.acme.model.dto;

import java.util.List;

/**
 * Response DTO for the form paths endpoint.
 * Contains the list of unique input paths required by all checks in a screener.
 */
public class FormPathsResponse {
    private List<String> paths;

    public FormPathsResponse() {
    }

    public FormPathsResponse(List<String> paths) {
        this.paths = paths;
    }

    public List<String> getPaths() {
        return paths;
    }

    public void setPaths(List<String> paths) {
        this.paths = paths;
    }
}
