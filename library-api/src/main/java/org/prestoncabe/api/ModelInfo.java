package org.prestoncabe.api;

import java.util.List;
import java.util.Objects;

/**
 * Metadata about a DMN model discovered at runtime.
 */
public class ModelInfo {
    private final String namespace;
    private final String modelName;
    private final List<String> decisionServices;
    private final List<String> decisions;
    private final String path;

    public ModelInfo(String namespace, String modelName, List<String> decisionServices, List<String> decisions, String path) {
        this.namespace = namespace;
        this.modelName = modelName;
        this.decisionServices = decisionServices;
        this.decisions = decisions;
        this.path = path;
    }

    public String getNamespace() {
        return namespace;
    }

    public String getModelName() {
        return modelName;
    }

    public List<String> getDecisionServices() {
        return decisionServices;
    }

    public List<String> getDecisions() {
        return decisions;
    }

    public String getPath() {
        return path;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ModelInfo modelInfo = (ModelInfo) o;
        return Objects.equals(namespace, modelInfo.namespace) &&
                Objects.equals(modelName, modelInfo.modelName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(namespace, modelName);
    }

    @Override
    public String toString() {
        return "ModelInfo{" +
                "namespace='" + namespace + '\'' +
                ", modelName='" + modelName + '\'' +
                ", decisionServices=" + decisionServices +
                ", decisions=" + decisions +
                ", path='" + path + '\'' +
                '}';
    }
}
