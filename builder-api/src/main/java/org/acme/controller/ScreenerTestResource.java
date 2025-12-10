
package org.acme.controller;
import org.acme.model.domain.ScreenerTest;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;

@Path("/api")
public class ScreenerTestResource {

    @PUT
    @Consumes
    @Path("")
    public void testScreener(@Context SecurityIdentity identity, ScreenerTest screenerTest) {
        // Write logic here
        Log.info(screenerTest);
    }

    @GET
    @Consumes
    @Path("")
    public String getScreenerTestResult() {
        // Write logic here
        return "Empty string";
    }

}