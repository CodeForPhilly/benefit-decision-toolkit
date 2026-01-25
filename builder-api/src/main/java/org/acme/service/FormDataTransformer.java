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
 */
public class FormDataTransformer {

    /**
     * Transforms form data by converting a "people" object (with personId keys) into a "people" array
     * (with id fields). This is the reverse of the frontend's transformInputDefinitionSchema function.
     *
     * @param formData The form data from the user, potentially containing a "people" object
     * @return A new Map with the "people" object converted to an array, or the original data if no transformation needed
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> transformFormData(Map<String, Object> formData) {
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
}
