package org.codeforphilly.bdt.library.api;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The parts of a reference written as DMN documentation rather than in the {@code reference} decision:
 * check rationale (descriptions on the {@code checks} context entries of a benefit), parameter descriptions
 * (descriptions on a check's {@code tParameters} components) and implementation notes (text annotations
 * associated with a decision).
 */
record ReferenceDocs(
    Map<String, String> checkRationale,
    List<Map<String, Object>> parameters,
    List<Map<String, Object>> implementationNotes
) {

    static final ReferenceDocs NONE = new ReferenceDocs(Map.of(), List.of(), List.of());

    static ReferenceDocs extract(Document doc) {
        Element definitions = doc.getDocumentElement();
        return new ReferenceDocs(checkRationale(definitions), parameters(definitions), implementationNotes(definitions));
    }

    private static Map<String, String> checkRationale(Element definitions) {
        Map<String, String> rationale = new LinkedHashMap<>();
        for (Element decision : children(definitions, "decision")) {
            if (!"checks".equals(decision.getAttribute("name"))) {
                continue;
            }
            for (Element context : children(decision, "context")) {
                for (Element entry : children(context, "contextEntry")) {
                    Element variable = child(entry, "variable");
                    String description = description(variable);
                    if (variable != null && description != null) {
                        rationale.put(variable.getAttribute("name"), description);
                    }
                }
            }
        }
        return Collections.unmodifiableMap(rationale);
    }

    private static List<Map<String, Object>> parameters(Element definitions) {
        List<Map<String, Object>> parameters = new ArrayList<>();
        for (Element item : children(definitions, "itemDefinition")) {
            if (!"tParameters".equals(item.getAttribute("name"))) {
                continue;
            }
            for (Element component : children(item, "itemComponent")) {
                Map<String, Object> parameter = new LinkedHashMap<>();
                parameter.put("name", component.getAttribute("name"));
                Element typeRef = child(component, "typeRef");
                parameter.put("type", typeRef == null ? null : typeRef.getTextContent().trim());
                parameter.put("description", description(component));
                parameters.add(Collections.unmodifiableMap(parameter));
            }
        }
        return List.copyOf(parameters);
    }

    private static List<Map<String, Object>> implementationNotes(Element definitions) {
        Map<String, String> decisionNames = new HashMap<>();
        Map<String, String> annotations = new HashMap<>();
        for (Element decision : children(definitions, "decision")) {
            decisionNames.put(decision.getAttribute("id"), decision.getAttribute("name"));
        }
        for (Element annotation : children(definitions, "textAnnotation")) {
            Element text = child(annotation, "text");
            if (text != null && !text.getTextContent().isBlank()) {
                annotations.put(annotation.getAttribute("id"), text.getTextContent().trim());
            }
        }
        List<Map<String, Object>> notes = new ArrayList<>();
        for (Element association : children(definitions, "association")) {
            String source = href(child(association, "sourceRef"));
            String target = href(child(association, "targetRef"));
            String decision = decisionNames.containsKey(source) ? decisionNames.get(source) : decisionNames.get(target);
            String text = annotations.containsKey(target) ? annotations.get(target) : annotations.get(source);
            if (decision != null && text != null) {
                Map<String, Object> note = new LinkedHashMap<>();
                note.put("decision", decision);
                note.put("text", text);
                notes.add(Collections.unmodifiableMap(note));
            }
        }
        return List.copyOf(notes);
    }

    private static String href(Element ref) {
        if (ref == null) {
            return null;
        }
        String href = ref.getAttribute("href");
        return href.startsWith("#") ? href.substring(1) : href;
    }

    private static String description(Element element) {
        Element description = child(element, "description");
        if (description == null || description.getTextContent().isBlank()) {
            return null;
        }
        return description.getTextContent().trim();
    }

    private static Element child(Element parent, String localName) {
        List<Element> matches = children(parent, localName);
        return matches.isEmpty() ? null : matches.getFirst();
    }

    private static List<Element> children(Element parent, String localName) {
        List<Element> children = new ArrayList<>();
        if (parent == null) {
            return children;
        }
        for (Node node = parent.getFirstChild(); node != null; node = node.getNextSibling()) {
            if (node instanceof Element element && localName.equals(element.getLocalName())) {
                children.add(element);
            }
        }
        return children;
    }
}
