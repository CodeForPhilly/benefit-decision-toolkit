package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;

@ApplicationScoped
public class CustomCheckDmnRenameValidator {
    public void validate(String originalXml, String renamedXml, String oldName, String newName) throws Exception {
        Document original = parse(originalXml);
        Document renamed = parse(renamedXml);
        Element originalDecision = decision(original, oldName);
        Element renamedDecision = decision(renamed, newName);
        String id = originalDecision.getAttribute("id");
        if (id.isBlank() || !id.equals(renamedDecision.getAttribute("id"))) {
            throw new IllegalArgumentException("A rename must preserve the original decision ID.");
        }
        if (!original.getDocumentElement().getAttribute("namespace")
                .equals(renamed.getDocumentElement().getAttribute("namespace"))) {
            throw new IllegalArgumentException("A rename must preserve the DMN model namespace.");
        }
    }

    private Document parse(String xml) throws Exception {
        if (xml.startsWith("\"")) {
            xml = new com.fasterxml.jackson.databind.ObjectMapper().readValue(xml, String.class);
        }
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
    }

    private Element decision(Document document, String name) {
        Element definitions = document.getDocumentElement();
        if (!"definitions".equals(definitions.getLocalName())) {
            throw new IllegalArgumentException("DMN definitions not found.");
        }
        NodeList decisions = definitions.getElementsByTagNameNS("*", "decision");
        Element target = null;
        for (int i = 0; i < decisions.getLength(); i++) {
            Element decision = (Element) decisions.item(i);
            if (name.equals(decision.getAttribute("name"))) {
                if (target != null) throw new IllegalArgumentException("More than one decision has the check name.");
                target = decision;
            }
        }
        if (target == null) throw new IllegalArgumentException("The check decision is missing from the DMN model.");
        return target;
    }
}
