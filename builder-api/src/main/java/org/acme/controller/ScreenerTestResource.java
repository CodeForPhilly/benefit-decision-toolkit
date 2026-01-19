
package org.acme.controller;
import org.acme.model.domain.ScreenerTest;

import io.quarkus.logging.Log;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;

@Path("/api")
public class ScreenerTestResource {

    @PUT
    @Path("/screenerTest")
    public void testScreener(@Context SecurityIdentity identity, ScreenerTest screenerTest) {

        // TODO: WRITE LOGIC HERE
        Log.info(screenerTest);
    }

    @GET
    @Consumes
    @Path("/screenerTest/{screenerTestId}")
    public String getScreenerTestResult(@Context SecurityIdentity identity, @PathParam("screenerTestId") String screenerTestId) {
        // Write logic here
        return "Empty string";
    }

}