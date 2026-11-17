package org.codeforphilly.bdt.builder.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

/*
This object contains the metadata required to display high level information about a Benefit. This is stored directly on
the screener document. Getting more detailed information about the Benefit and its Eligibility Checks configuration
requires fetching the Benefit object which is stored in a separate firestore collection.
 */

@JsonIgnoreProperties(ignoreUnknown = true)
public class BenefitDetail {
    /** Library reference (see GLOSSARY.md), copied from library metadata; null for custom items. */
    private JsonNode reference;
    private String id;
    private String name;
    private String description;

    public BenefitDetail() {
    }

    public BenefitDetail(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    /** The screener's summary of a stored benefit, keeping its library reference if it has one. */
    public static BenefitDetail from(Benefit benefit) {
        BenefitDetail detail = new BenefitDetail(benefit.getId(), benefit.getName(), benefit.getDescription());
        detail.setReference(benefit.getReference());
        return detail;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public JsonNode getReference() {
        return reference;
    }

    public void setReference(JsonNode reference) {
        this.reference = reference;
    }
}
