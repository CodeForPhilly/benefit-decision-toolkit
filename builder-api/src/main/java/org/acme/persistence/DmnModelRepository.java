package org.acme.persistence;

import org.acme.model.domain.DmnModel;

import java.util.List;
import java.util.Optional;

public interface DmnModelRepository {

    public List<DmnModel> getAllDmnModels();

    public Optional<DmnModel> getDmnModel(String groupId, String artifactId, String version);
}
