package org.acme.mapper;

import org.acme.constants.FieldNames;
import org.acme.model.Screener;

import java.util.HashMap;
import java.util.Map;

public class ScreenerMapper {

    public static Screener fromMap(Map<String, Object> map){
        Screener screener = new Screener();

        if (doesAttributeExistOfType(map, FieldNames.ID, String.class)){
            screener.setId((String) map.get(FieldNames.ID));
        }
        if (doesAttributeExistOfType(map, FieldNames.SCREENER_NAME, String.class)){
            screener.setScreenerName((String) map.get(FieldNames.SCREENER_NAME));
        }
        if (doesAttributeExistOfType(map, FieldNames.IS_PUBLISHED, Boolean.class)){
            screener.setIsPublished((Boolean) map.get(FieldNames.IS_PUBLISHED));
        }
        if (doesAttributeExistOfType(map, FieldNames.PUBLISHED_DMN_NAME, String.class)){
            screener.setPublishedDmnName((String) map.get(FieldNames.PUBLISHED_DMN_NAME));
        }
        if (doesAttributeExistOfType(map, FieldNames.PUBLISHED_DMN_NAMESPACE, String.class)){
            screener.setPublishedDmnNameSpace((String) map.get(FieldNames.PUBLISHED_DMN_NAMESPACE));
        }

        return screener;
    }

    private static boolean doesAttributeExistOfType(Map<String, Object> map, String attributeName, Class<?> expectedType) {
        return map.containsKey(attributeName) && expectedType.isInstance(map.get(attributeName));
    }
}
