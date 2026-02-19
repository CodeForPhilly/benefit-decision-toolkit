package org.acme.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class for transforming form data between different formats.
 *
 * The Form-JS editor uses a "people" object with personId keys (e.g., {applicant: {...}, spouse: {...}}),
 * while DMN models expect a "people" array with id fields (e.g., [{id: "applicant", ...}, {id: "spouse", ...}]).
 *
 * Enrollments are stored per-person as arrays of benefit strings (e.g., {applicant: {enrollments: ["SNAP", "Medicaid"]}}),
 * while DMN models expect a flat enrollments array (e.g., [{personId: "applicant", benefit: "SNAP"}, ...]).
 */
public class FormDataTransformer {

    /**
     * Transforms form data by applying all data transformations.
     * Currently applies:
     * 1. People transformation: converts people object to array with id fields
     * 2. Enrollments transformation: extracts enrollments from people objects into flat array
     *
     * @param formData The form data from the user
     * @return A new Map with all transformations applied
     */
    public static Map<String, Object> transformFormData(Map<String, Object> formData) {
        if (formData == null) {
            return new HashMap<>();
        }

        // Apply each transformation in sequence
        Map<String, Object> result = new HashMap<>(formData);
        result = transformPeopleData(result);
        result = transformEnrollmentsData(result);

        return result;
    }

    /**
     * Transforms a "people" object (with personId keys) into a "people" array (with id fields).
     *
     * Example:
     *   Input:  { people: { applicant: { dateOfBirth: "1960-01-01" } } }
     *   Output: { people: [{ id: "applicant", dateOfBirth: "1960-01-01" }] }
     *
     * @param formData The form data potentially containing a "people" object
     * @return A new Map with the "people" object converted to an array
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> transformPeopleData(Map<String, Object> formData) {
        if (formData == null) {
            return new HashMap<>();
        }

        Object peopleValue = formData.get("people");

        // If no people key, or it's already a List (array), return a copy of the original
        if (peopleValue == null || peopleValue instanceof List) {
            return new HashMap<>(formData);
        }

        // If people is not a Map (object), return a copy of the original
        if (!(peopleValue instanceof Map)) {
            return new HashMap<>(formData);
        }

        Map<String, Object> peopleObject = (Map<String, Object>) peopleValue;
        List<Map<String, Object>> peopleArray = new ArrayList<>();

        // Convert each entry in the people object to an array element with an "id" field
        for (Map.Entry<String, Object> entry : peopleObject.entrySet()) {
            String personId = entry.getKey();
            Object personValue = entry.getValue();

            if (personValue instanceof Map) {
                Map<String, Object> personData = new HashMap<>((Map<String, Object>) personValue);
                personData.put("id", personId);
                peopleArray.add(personData);
            } else {
                // If the value is not a Map, create a simple object with just the id
                Map<String, Object> personData = new HashMap<>();
                personData.put("id", personId);
                peopleArray.add(personData);
            }
        }

        // Create the result with the transformed people array
        Map<String, Object> result = new HashMap<>(formData);
        result.put("people", peopleArray);

        return result;
    }

    /**
     * Extracts enrollments from people objects and creates a flat enrollments array.
     * Must be called after transformPeopleData (expects people to be an array).
     *
     * Example:
     *   Input:  { people: [{ id: "applicant", enrollments: ["SNAP", "Medicaid"] }] }
     *   Output: { people: [{ id: "applicant" }], enrollments: [{ personId: "applicant", benefit: "SNAP" }, { personId: "applicant", benefit: "Medicaid" }] }
     *
     * @param formData The form data with people as an array
     * @return A new Map with enrollments extracted into a flat array
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> transformEnrollmentsData(Map<String, Object> formData) {
        if (formData == null) {
            return new HashMap<>();
        }

        Object peopleValue = formData.get("people");

        // If no people key or it's not a List, return a copy of the original
        if (!(peopleValue instanceof List)) {
            return new HashMap<>(formData);
        }

        List<Map<String, Object>> peopleArray = (List<Map<String, Object>>) peopleValue;
        List<Map<String, Object>> enrollmentsList = new ArrayList<>();
        List<Map<String, Object>> transformedPeopleArray = new ArrayList<>();

        // Extract enrollments from each person
        for (Map<String, Object> person : peopleArray) {
            String personId = (String) person.get("id");
            Object personEnrollments = person.get("enrollments");

            // Create a copy of the person data without enrollments
            Map<String, Object> personCopy = new HashMap<>(person);

            if (personEnrollments instanceof List) {
                // Remove enrollments from person object (DMN doesn't expect it there)
                personCopy.remove("enrollments");

                // Convert each enrollment string to an enrollment object
                for (Object enrollment : (List<?>) personEnrollments) {
                    if (enrollment instanceof String) {
                        Map<String, Object> enrollmentEntry = new HashMap<>();
                        enrollmentEntry.put("personId", personId);
                        enrollmentEntry.put("benefit", enrollment);
                        enrollmentsList.add(enrollmentEntry);
                    }
                }
            }

            transformedPeopleArray.add(personCopy);
        }

        // Create the result
        Map<String, Object> result = new HashMap<>(formData);
        result.put("people", transformedPeopleArray);

        // Only add enrollments if we extracted any
        if (!enrollmentsList.isEmpty()) {
            result.put("enrollments", enrollmentsList);
        }

        return result;
    }
}
