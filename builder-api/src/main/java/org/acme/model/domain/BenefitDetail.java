package org.acme.model.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/*
This object contains the metadata required to display high level information about a Benefit. This is stored directly on
the screener document. Getting more detailed information about the Benefit and its Eligibility Checks configuration
requires fetching the Benefit object which is stored in a separate firestore collection.
 */

@JsonIgnoreProperties(ignoreUnknown = true)
public class BenefitDetail {
    private String id;
    private String name;
    private String description;

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
}
