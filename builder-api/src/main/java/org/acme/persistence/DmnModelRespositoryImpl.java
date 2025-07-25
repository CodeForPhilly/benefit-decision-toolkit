package org.acme.persistence;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.constants.CollectionNames;
import org.acme.mapper.DmnModelMapper;
import org.acme.model.domain.DmnModel;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class DmnModelRespositoryImpl implements DmnModelRepository{
    @Override
    public List<DmnModel> getAllDmnModels() {
        List<Map<String, Object>> dmnMaps = FirestoreUtils.getAllDocsInCollection(
                CollectionNames.DMN_MODEL_COLLECTION);

        return dmnMaps.stream().map(DmnModelMapper::fromMap).toList();
    }


    public Optional<DmnModel> getDmnModel(String groupId, String artifactId, String version){

        validateKeyComponent("groupId", groupId);
        validateKeyComponent("artifactId", artifactId);
        validateKeyComponent("version", version);

        String key = getDmnModelId(groupId, artifactId, version);

        Optional<Map<String, Object>> modelOptional = FirestoreUtils.getFirestoreDocById(CollectionNames.DMN_MODEL_COLLECTION, key);

        if (modelOptional.isPresent()){
            DmnModel model = DmnModelMapper.fromMap(modelOptional.get());
            return Optional.of(model);
        } else {
            return Optional.empty();
        }
    }

    private static String getDmnModelId(String groupId, String artifactId, String version) {
        String key = String.join(":", groupId, artifactId, version);
        return key;
    }

    private void validateKeyComponent(String name, String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException(name + " must not be null or empty");
        }
        if (value.contains(":") || value.contains("/") || value.length() > 100) {
            throw new IllegalArgumentException(name + " contains invalid characters or is too long");
        }
    }

}
