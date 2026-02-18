package org.acme.service;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class FormDataTransformerTest {

    // ==== transformPeopleData tests ====

    @Test
    void transformPeopleData_withPeopleObject_convertsToArray() {
        Map<String, Object> applicantData = new HashMap<>();
        applicantData.put("dateOfBirth", "1960-01-01");

        Map<String, Object> peopleObject = new HashMap<>();
        peopleObject.put("applicant", applicantData);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleObject);

        Map<String, Object> result = FormDataTransformer.transformPeopleData(formData);

        // Verify people is now an array
        assertTrue(result.get("people") instanceof List);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> peopleArray = (List<Map<String, Object>>) result.get("people");
        assertEquals(1, peopleArray.size());

        // Verify the person has id field and original data
        Map<String, Object> person = peopleArray.get(0);
        assertEquals("applicant", person.get("id"));
        assertEquals("1960-01-01", person.get("dateOfBirth"));
    }

    @Test
    void transformPeopleData_withMultiplePeople_convertsAll() {
        Map<String, Object> applicantData = new HashMap<>();
        applicantData.put("dateOfBirth", "1960-01-01");

        Map<String, Object> spouseData = new HashMap<>();
        spouseData.put("dateOfBirth", "1965-05-15");

        Map<String, Object> peopleObject = new HashMap<>();
        peopleObject.put("applicant", applicantData);
        peopleObject.put("spouse", spouseData);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleObject);

        Map<String, Object> result = FormDataTransformer.transformPeopleData(formData);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> peopleArray = (List<Map<String, Object>>) result.get("people");
        assertEquals(2, peopleArray.size());

        // Find both people by id
        Set<String> ids = new HashSet<>();
        for (Map<String, Object> person : peopleArray) {
            ids.add((String) person.get("id"));
        }
        assertTrue(ids.contains("applicant"));
        assertTrue(ids.contains("spouse"));
    }

    @Test
    void transformPeopleData_withPeopleAlreadyArray_returnsOriginal() {
        List<Map<String, Object>> peopleArray = new ArrayList<>();
        Map<String, Object> person = new HashMap<>();
        person.put("id", "applicant");
        peopleArray.add(person);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleArray);

        Map<String, Object> result = FormDataTransformer.transformPeopleData(formData);

        // Should return a copy of the original
        assertTrue(result.get("people") instanceof List);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> resultArray = (List<Map<String, Object>>) result.get("people");
        assertEquals(1, resultArray.size());
    }

    @Test
    void transformPeopleData_withNoPeople_returnsOriginal() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("income", 50000);

        Map<String, Object> result = FormDataTransformer.transformPeopleData(formData);

        assertEquals(50000, result.get("income"));
        assertFalse(result.containsKey("people"));
    }

    @Test
    void transformPeopleData_withNullInput_returnsEmptyMap() {
        Map<String, Object> result = FormDataTransformer.transformPeopleData(null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ==== transformEnrollmentsData tests ====

    @Test
    void transformEnrollmentsData_withPersonEnrollments_extractsToFlatArray() {
        // Setup: people array with enrollments inside person object
        Map<String, Object> person = new HashMap<>();
        person.put("id", "applicant");
        person.put("dateOfBirth", "1960-01-01");
        person.put("enrollments", Arrays.asList("SNAP", "Medicaid"));

        List<Map<String, Object>> peopleArray = new ArrayList<>();
        peopleArray.add(person);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleArray);

        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(formData);

        // Verify enrollments is now a flat array at top level
        assertTrue(result.containsKey("enrollments"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> enrollments = (List<Map<String, Object>>) result.get("enrollments");
        assertEquals(2, enrollments.size());

        // Verify enrollment entries have personId and benefit
        Map<String, Object> enrollment1 = enrollments.get(0);
        assertEquals("applicant", enrollment1.get("personId"));
        assertTrue(enrollment1.get("benefit").equals("SNAP") || enrollment1.get("benefit").equals("Medicaid"));

        // Verify enrollments removed from person object
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> resultPeople = (List<Map<String, Object>>) result.get("people");
        Map<String, Object> resultPerson = resultPeople.get(0);
        assertFalse(resultPerson.containsKey("enrollments"));
        assertEquals("applicant", resultPerson.get("id"));
        assertEquals("1960-01-01", resultPerson.get("dateOfBirth"));
    }

    @Test
    void transformEnrollmentsData_withMultiplePeopleEnrollments_extractsAll() {
        Map<String, Object> applicant = new HashMap<>();
        applicant.put("id", "applicant");
        applicant.put("enrollments", Arrays.asList("SNAP"));

        Map<String, Object> spouse = new HashMap<>();
        spouse.put("id", "spouse");
        spouse.put("enrollments", Arrays.asList("Medicare", "Medicaid"));

        List<Map<String, Object>> peopleArray = new ArrayList<>();
        peopleArray.add(applicant);
        peopleArray.add(spouse);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleArray);

        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(formData);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> enrollments = (List<Map<String, Object>>) result.get("enrollments");
        assertEquals(3, enrollments.size());

        // Count enrollments per person
        int applicantCount = 0;
        int spouseCount = 0;
        for (Map<String, Object> enrollment : enrollments) {
            if ("applicant".equals(enrollment.get("personId"))) {
                applicantCount++;
            } else if ("spouse".equals(enrollment.get("personId"))) {
                spouseCount++;
            }
        }
        assertEquals(1, applicantCount);
        assertEquals(2, spouseCount);
    }

    @Test
    void transformEnrollmentsData_withNoEnrollments_doesNotAddEnrollmentsKey() {
        Map<String, Object> person = new HashMap<>();
        person.put("id", "applicant");
        person.put("dateOfBirth", "1960-01-01");

        List<Map<String, Object>> peopleArray = new ArrayList<>();
        peopleArray.add(person);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleArray);

        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(formData);

        assertFalse(result.containsKey("enrollments"));
    }

    @Test
    void transformEnrollmentsData_withEmptyEnrollmentsArray_doesNotAddEnrollmentsKey() {
        Map<String, Object> person = new HashMap<>();
        person.put("id", "applicant");
        person.put("enrollments", new ArrayList<>());

        List<Map<String, Object>> peopleArray = new ArrayList<>();
        peopleArray.add(person);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleArray);

        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(formData);

        assertFalse(result.containsKey("enrollments"));
    }

    @Test
    void transformEnrollmentsData_withPeopleNotArray_returnsOriginal() {
        Map<String, Object> formData = new HashMap<>();
        formData.put("people", "not an array");

        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(formData);

        assertEquals("not an array", result.get("people"));
    }

    @Test
    void transformEnrollmentsData_withNullInput_returnsEmptyMap() {
        Map<String, Object> result = FormDataTransformer.transformEnrollmentsData(null);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ==== transformFormData composition tests ====

    @Test
    void transformFormData_appliesBothTransforms() {
        // Setup: people as object with enrollments inside
        Map<String, Object> applicantData = new HashMap<>();
        applicantData.put("dateOfBirth", "1960-01-01");
        applicantData.put("enrollments", Arrays.asList("SNAP", "Medicaid"));

        Map<String, Object> peopleObject = new HashMap<>();
        peopleObject.put("applicant", applicantData);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleObject);

        Map<String, Object> result = FormDataTransformer.transformFormData(formData);

        // Verify people is now an array with id field
        assertTrue(result.get("people") instanceof List);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> peopleArray = (List<Map<String, Object>>) result.get("people");
        assertEquals(1, peopleArray.size());
        assertEquals("applicant", peopleArray.get(0).get("id"));
        assertEquals("1960-01-01", peopleArray.get(0).get("dateOfBirth"));
        assertFalse(peopleArray.get(0).containsKey("enrollments"));

        // Verify enrollments is now a flat array
        assertTrue(result.containsKey("enrollments"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> enrollments = (List<Map<String, Object>>) result.get("enrollments");
        assertEquals(2, enrollments.size());
    }

    @Test
    void transformFormData_preservesOtherFields() {
        Map<String, Object> applicantData = new HashMap<>();
        applicantData.put("dateOfBirth", "1960-01-01");

        Map<String, Object> peopleObject = new HashMap<>();
        peopleObject.put("applicant", applicantData);

        Map<String, Object> formData = new HashMap<>();
        formData.put("people", peopleObject);
        formData.put("income", 50000);
        formData.put("householdSize", 3);

        Map<String, Object> result = FormDataTransformer.transformFormData(formData);

        assertEquals(50000, result.get("income"));
        assertEquals(3, result.get("householdSize"));
    }
}
