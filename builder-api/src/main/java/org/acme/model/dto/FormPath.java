package org.acme.model.dto;

/**
 * Represents a form path with its associated JSON Schema type.
 * Used for type-aware form field key selection.
 */
public class FormPath {
    private String path;
    private String type;

    public FormPath() {
    }

    public FormPath(String path, String type) {
        this.path = path;
        this.type = type;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
