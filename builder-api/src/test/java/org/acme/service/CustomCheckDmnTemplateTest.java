package org.acme.service;

import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomCheckDmnTemplateTest {

    private static final String DMN_NAMESPACE = "https://www.omg.org/spec/DMN/20240513/MODEL/";

    private final CustomCheckDmnTemplate template = new CustomCheckDmnTemplate();

    @Test
    void createsAValidStarterModelForTheCheck() throws Exception {
        String checkName = "Owns and occupies home";
        String xml = template.create(checkName, "Applicant's home is <eligible>");

        Document document = parse(xml);
        Element definitions = document.getDocumentElement();
        assertEquals(checkName, definitions.getAttribute("name"));
        assertEquals("Applicant's home is <eligible>", textOf(document, "description", 0));

        Element input = element(document, "inputData", 0);
        String inputName = checkName + " input";
        assertEquals(inputName, input.getAttribute("name"));
        assertEquals(inputName, element(input, "variable", 0).getAttribute("name"));
        assertEquals("Any", element(input, "variable", 0).getAttribute("typeRef"));

        Element decision = element(document, "decision", 0);
        assertEquals(checkName, decision.getAttribute("name"));
        assertEquals("boolean", element(decision, "variable", 0).getAttribute("typeRef"));
        String starterExpression = textOf(decision, "text", 0);
        assertTrue(starterExpression.startsWith("// Replace this starter expression"));
        assertTrue(starterExpression.endsWith(inputName));

        Element requiredInput = element(decision, "requiredInput", 0);
        assertEquals("#" + input.getAttribute("id"), requiredInput.getAttribute("href"));
        assertEquals(1, document.getElementsByTagNameNS(DMN_NAMESPACE, "textAnnotation").getLength());
        assertEquals(1, document.getElementsByTagNameNS(DMN_NAMESPACE, "association").getLength());

        KieDmnService dmnService = new KieDmnService();
        assertTrue(dmnService.validateDmnXml(xml, Map.of(), checkName, checkName).isEmpty());
    }

    @Test
    void givesEachStarterModelAUniqueIdentity() throws Exception {
        Document first = parse(template.create("A check", "Description"));
        Document second = parse(template.create("A check", "Description"));

        assertNotEquals(
            first.getDocumentElement().getAttribute("namespace"),
            second.getDocumentElement().getAttribute("namespace")
        );
        assertNotEquals(
            first.getDocumentElement().getAttribute("id"),
            second.getDocumentElement().getAttribute("id")
        );
    }

    private static Document parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        return factory.newDocumentBuilder().parse(
            new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8))
        );
    }

    private static Element element(Document document, String localName, int index) {
        return (Element) document.getElementsByTagNameNS(DMN_NAMESPACE, localName).item(index);
    }

    private static Element element(Element parent, String localName, int index) {
        return (Element) parent.getElementsByTagNameNS(DMN_NAMESPACE, localName).item(index);
    }

    private static String textOf(Document document, String localName, int index) {
        return document.getElementsByTagNameNS(DMN_NAMESPACE, localName).item(index).getTextContent();
    }

    private static String textOf(Element parent, String localName, int index) {
        return parent.getElementsByTagNameNS(DMN_NAMESPACE, localName).item(index).getTextContent();
    }
}
