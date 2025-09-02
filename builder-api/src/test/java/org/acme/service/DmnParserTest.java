package org.acme.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class DmnParserTest {

    private String testXml = """
<dmn:definitions xmlns:dmn="http://www.omg.org/spec/DMN/20180521/MODEL/" xmlns="https://kiegroup.org/dmn/_C5C2425E-07F9-49C4-9749-CEDC5AD3E9B5" xmlns:feel="http://www.omg.org/spec/DMN/20180521/FEEL/" xmlns:kie="http://www.drools.org/kie/dmn/1.2" xmlns:dmndi="http://www.omg.org/spec/DMN/20180521/DMNDI/" xmlns:di="http://www.omg.org/spec/DMN/20180521/DI/" xmlns:dc="http://www.omg.org/spec/DMN/20180521/DC/" id="_C85D6036-48D4-4E30-A48F-CB354C3F49D2" name="TEST_NAME" typeLanguage="http://www.omg.org/spec/DMN/20180521/FEEL/" namespace="TEST_NAMESPACE">
<dmn:extensionElements/>
<dmn:decision id="_25ADB2C3-227C-4B8F-B12C-70CEEF3026E7" name="Philly Tax Screener">
<dmn:extensionElements/>
<dmn:variable id="_E9DD428C-209A-4497-BD6E-A4F6B35B3CC0" name="Philly Tax Screener" typeRef="string"/>
<dmn:informationRequirement id="_B3AB6DB3-9FC1-4003-8586-82A3863501F1">
            <dmn:requiredInput href="#_CBD14336-FDF5-4152-874F-F0F678E7FBEB"/>
            </dmn:informationRequirement>
<dmn:decisionTable id="_7E3125C5-072E-4472-BADB-446092BEC2BA" hitPolicy="UNIQUE" preferredOrientation="Rule-as-Row">
<dmn:input id="_C0FD4181-C97E-4F7A-B92E-0A701775B4CF">
            <dmn:inputExpression id="_01D83DB2-CDBE-4668-B37B-C6969387136B" typeRef="number">
<dmn:text>householdCount</dmn:text>
</dmn:inputExpression>
</dmn:input>
<dmn:output id="_7D6CDF10-5706-41EC-83AA-29BC3FCCA642"/>
            <dmn:annotation name="annotation-1"/>
            <dmn:rule id="_4D815217-06C5-4231-9479-888BBB4157AF">
            <dmn:inputEntry id="_6465E980-27BA-48CA-BB52-8E2B60489CD8">
            <dmn:text>>4</dmn:text>
</dmn:inputEntry>
<dmn:outputEntry id="_5A58C1AB-1CAE-4311-B0E3-DB1F1C5D4ED8">
            <dmn:text>"Eligable"</dmn:text>
</dmn:outputEntry>
<dmn:annotationEntry>
<dmn:text/>
</dmn:annotationEntry>
</dmn:rule>
<dmn:rule id="_A5E6DE7D-69A8-48CB-BB0A-3568A089D91B">
            <dmn:inputEntry id="_4E877882-55F8-46EC-BF3A-476772BA6BD2">
            <dmn:text>&lt;=4</dmn:text>
</dmn:inputEntry>
<dmn:outputEntry id="_D656A36C-786E-48D1-BD92-A9BC40D584E2">
            <dmn:text>"Not eligable"</dmn:text>
</dmn:outputEntry>
<dmn:annotationEntry>
<dmn:text/>
</dmn:annotationEntry>
</dmn:rule>
</dmn:decisionTable>
</dmn:decision>
<dmn:inputData id="_CBD14336-FDF5-4152-874F-F0F678E7FBEB" name="householdCount">
<dmn:extensionElements/>
<dmn:variable id="_9E8817DD-D966-45A7-906C-389BDFD2E912" name="householdCount"/>
</dmn:inputData>
<dmndi:DMNDI>
<dmndi:DMNDiagram id="_92284F1F-C1DE-4BB8-B2DD-ECF987AFC2E3" name="DRG">
<di:extension>
<kie:ComponentsWidthsExtension>
<kie:ComponentWidths dmnElementRef="_7E3125C5-072E-4472-BADB-446092BEC2BA">
            <kie:width>50</kie:width>
<kie:width>100</kie:width>
<kie:width>100</kie:width>
<kie:width>100</kie:width>
</kie:ComponentWidths>
</kie:ComponentsWidthsExtension>
</di:extension>
<dmndi:DMNShape id="dmnshape-drg-_25ADB2C3-227C-4B8F-B12C-70CEEF3026E7" dmnElementRef="_25ADB2C3-227C-4B8F-B12C-70CEEF3026E7" isCollapsed="false">
<dmndi:DMNStyle>
<dmndi:FillColor red="255" green="255" blue="255"/>
<dmndi:StrokeColor red="0" green="0" blue="0"/>
<dmndi:FontColor red="0" green="0" blue="0"/>
</dmndi:DMNStyle>
<dc:Bounds x="236" y="176" width="100" height="50"/>
<dmndi:DMNLabel/>
</dmndi:DMNShape>
<dmndi:DMNShape id="dmnshape-drg-_CBD14336-FDF5-4152-874F-F0F678E7FBEB" dmnElementRef="_CBD14336-FDF5-4152-874F-F0F678E7FBEB" isCollapsed="false">
<dmndi:DMNStyle>
<dmndi:FillColor red="255" green="255" blue="255"/>
<dmndi:StrokeColor red="0" green="0" blue="0"/>
<dmndi:FontColor red="0" green="0" blue="0"/>
</dmndi:DMNStyle>
<dc:Bounds x="241" y="335" width="100" height="50"/>
<dmndi:DMNLabel/>
</dmndi:DMNShape>
<dmndi:DMNEdge id="dmnedge-drg-_B3AB6DB3-9FC1-4003-8586-82A3863501F1-AUTO-TARGET" dmnElementRef="_B3AB6DB3-9FC1-4003-8586-82A3863501F1">
<di:waypoint x="291" y="360"/>
<di:waypoint x="286" y="226"/>
</dmndi:DMNEdge>
</dmndi:DMNDiagram>
</dmndi:DMNDI>
</dmn:definitions>
            """;

    @Test
    public void testParseDmnName(){
        DmnParser dmnParser = new DmnParser(testXml);
        assertEquals(dmnParser.getName(), "TEST_NAME");
    }

    @Test
    public void testParseDmnNameSpace(){
        DmnParser dmnParser = new DmnParser(testXml);
        assertEquals(dmnParser.getNameSpace(), "TEST_NAMESPACE");
    }

    @Test
    public void testParseDmnNameNullInputReturnsNull(){
        DmnParser dmnParser = new DmnParser(null);
        assertNull(dmnParser.getName());
    }


    @Test
    public void testParseDmnNameSpaceNullInputReturnsNull(){
        DmnParser dmnParser = new DmnParser(null);
        assertNull(dmnParser.getNameSpace());
    }
}