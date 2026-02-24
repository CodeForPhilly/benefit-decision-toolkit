package org.acme.model.dto;

import java.util.List;

import org.acme.model.domain.FormPath;

/**
 * Response DTO for the form paths endpoint.
 * Contains the list of unique input paths required by all checks in a screener.
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
