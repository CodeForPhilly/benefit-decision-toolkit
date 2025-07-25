package org.acme.service;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.mapper.DmnModelMapper;
import org.acme.model.domain.DmnModel;
import org.acme.model.dto.Dependency;
import org.acme.model.dto.DmnModelSummary;
import org.acme.persistence.DmnModelRepository;
import org.acme.persistence.StorageService;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ModelLibraryService {

    @Inject
    DmnModelRepository dmnModelRepository;

    @Inject
    StorageService storageService;

    public Response getDmnModels(){

        List<DmnModel> dmnModels = dmnModelRepository.getAllDmnModels();
        List<DmnModelSummary> modelSummaries = dmnModels.stream()
                .map(model -> DmnModelMapper.summaryFromDmnModel(model))
                .toList();

        return Response.ok(modelSummaries, MediaType.APPLICATION_JSON).build();
    }

    public Response getDmnModel(String groupId, String artifactId, String version){

        if (!isIdValid(groupId) || !isIdValid(artifactId) || !isIdValid(version)){
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        Optional<DmnModel> dmnModelOpt = dmnModelRepository.getDmnModel(groupId, artifactId, version);

        if (dmnModelOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Optional<String> xmlOpt = storageService.getStringFromStorage(dmnModelOpt.get().getStorageLocation());

        if (xmlOpt.isEmpty()){
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Dependency dependency = new Dependency();
        dependency.groupId = groupId;
        dependency.artifactId = artifactId;
        dependency.version = version;
        dependency.xml = xmlOpt.get();

        return Response.ok().entity(dependency).build();
    }

    // validate Ids coming from URL to avoid injection attacks
    public boolean isIdValid(String id){
        if (!id.matches("^[a-zA-Z0-9_.-]{3,64}$")) {
            return false;
        }
        return true;
    }
}
