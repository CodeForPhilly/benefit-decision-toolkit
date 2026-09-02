package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class CustomCheckDmnTemplate {

    public String create(String checkName, String checkDescription) {
        String inputName = checkName + " input";
        String definitionsId = newId();
        String inputId = newId();
        String inputVariableId = newId();
        String decisionId = newId();
        String decisionVariableId = newId();
        String requirementId = newId();
        String expressionId = newId();
        String annotationId = newId();
        String associationId = newId();
        String diagramId = newId();
        String namespace = "https://bdt.codeforphilly.org/dmn/" + UUID.randomUUID();

        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20240513/MODEL/"
              xmlns="%s"
              xmlns:feel="https://www.omg.org/spec/DMN/20240513/FEEL/"
              xmlns:kie="https://kie.org/dmn/extensions/1.0"
              xmlns:dmndi="https://www.omg.org/spec/DMN/20230324/DMNDI/"
              xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/"
              xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/"
              id="%s" name="%s"
              typeLanguage="https://www.omg.org/spec/DMN/20240513/FEEL/"
              namespace="%s">
              <dmn:description>%s</dmn:description>
              <dmn:extensionElements/>
              <dmn:inputData id="%s" name="%s">
                <dmn:description>Replace or rename this placeholder with the data needed to evaluate the check.</dmn:description>
                <dmn:extensionElements/>
                <dmn:variable id="%s" name="%s" typeRef="Any"/>
              </dmn:inputData>
              <dmn:decision id="%s" name="%s">
                <dmn:description>Return true when the applicant passes this eligibility check and false when they do not.</dmn:description>
                <dmn:extensionElements/>
                <dmn:variable id="%s" name="%s" typeRef="boolean"/>
                <dmn:informationRequirement id="%s">
                  <dmn:requiredInput href="#%s"/>
                </dmn:informationRequirement>
                <dmn:literalExpression id="%s">
                  <dmn:text>// Replace this starter expression with the check's eligibility logic.
            %s</dmn:text>
                </dmn:literalExpression>
              </dmn:decision>
              <dmn:textAnnotation id="%s" textFormat="text/plain">
                <dmn:text>Start here: rename or replace the input, then edit the decision so it returns true or false. Keep the decision name unchanged so the toolkit can find it.</dmn:text>
              </dmn:textAnnotation>
              <dmn:association id="%s" associationDirection="None">
                <dmn:sourceRef href="#%s"/>
                <dmn:targetRef href="#%s"/>
              </dmn:association>
              <dmndi:DMNDI>
                <dmndi:DMNDiagram id="%s" name="DRG">
                  <di:extension>
                    <kie:ComponentsWidthsExtension>
                      <kie:ComponentWidths dmnElementRef="%s">
                        <kie:width>420</kie:width>
                      </kie:ComponentWidths>
                    </kie:ComponentsWidthsExtension>
                  </di:extension>
                  <dmndi:DMNShape id="dmnshape-drg-%s" dmnElementRef="%s" isCollapsed="false">
                    <dmndi:DMNStyle>
                      <dmndi:FillColor red="255" green="255" blue="255"/>
                      <dmndi:StrokeColor red="0" green="0" blue="0"/>
                      <dmndi:FontColor red="0" green="0" blue="0"/>
                    </dmndi:DMNStyle>
                    <dc:Bounds x="220" y="330" width="160" height="80"/>
                    <dmndi:DMNLabel/>
                  </dmndi:DMNShape>
                  <dmndi:DMNShape id="dmnshape-drg-%s" dmnElementRef="%s" isCollapsed="false">
                    <dmndi:DMNStyle>
                      <dmndi:FillColor red="255" green="255" blue="255"/>
                      <dmndi:StrokeColor red="0" green="0" blue="0"/>
                      <dmndi:FontColor red="0" green="0" blue="0"/>
                    </dmndi:DMNStyle>
                    <dc:Bounds x="220" y="130" width="160" height="80"/>
                    <dmndi:DMNLabel/>
                  </dmndi:DMNShape>
                  <dmndi:DMNShape id="dmnshape-drg-%s" dmnElementRef="%s" isCollapsed="false">
                    <dmndi:DMNStyle fontSize="14">
                      <dmndi:FillColor red="255" green="255" blue="255"/>
                      <dmndi:StrokeColor red="0" green="0" blue="0"/>
                      <dmndi:FontColor red="0" green="0" blue="0"/>
                    </dmndi:DMNStyle>
                    <dc:Bounds x="470" y="105" width="360" height="130"/>
                    <dmndi:DMNLabel/>
                  </dmndi:DMNShape>
                  <dmndi:DMNEdge id="dmnedge-drg-%s" dmnElementRef="%s">
                    <di:waypoint x="300" y="330"/>
                    <di:waypoint x="300" y="210"/>
                  </dmndi:DMNEdge>
                  <dmndi:DMNEdge id="dmnedge-drg-%s" dmnElementRef="%s">
                    <di:waypoint x="470" y="170"/>
                    <di:waypoint x="380" y="170"/>
                  </dmndi:DMNEdge>
                </dmndi:DMNDiagram>
              </dmndi:DMNDI>
            </dmn:definitions>
            """.formatted(
                escapeAttribute(namespace),
                definitionsId,
                escapeAttribute(checkName),
                escapeAttribute(namespace),
                escapeText(checkDescription),
                inputId,
                escapeAttribute(inputName),
                inputVariableId,
                escapeAttribute(inputName),
                decisionId,
                escapeAttribute(checkName),
                decisionVariableId,
                escapeAttribute(checkName),
                requirementId,
                inputId,
                expressionId,
                escapeText(inputName),
                annotationId,
                associationId,
                annotationId,
                decisionId,
                diagramId,
                expressionId,
                inputId,
                inputId,
                decisionId,
                decisionId,
                annotationId,
                annotationId,
                requirementId,
                requirementId,
                associationId,
                associationId
            );
    }

    private static String newId() {
        return "_" + UUID.randomUUID().toString().toUpperCase();
    }

    private static String escapeAttribute(String value) {
        return escapeText(value).replace("\"", "&quot;").replace("'", "&apos;");
    }

    private static String escapeText(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
