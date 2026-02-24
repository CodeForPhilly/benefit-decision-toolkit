package org.acme.model.domain;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false; // Check for null and type equality
        FormPath formPath = (FormPath) o; // Cast the object
        // Compare relevant fields using Objects.equals() for objects and == for primitives
        return path.equals(formPath.path) && type.equals(formPath.type);
    }
}
