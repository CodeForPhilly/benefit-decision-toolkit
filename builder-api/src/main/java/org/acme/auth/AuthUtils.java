package org.acme.auth;

import io.quarkus.security.identity.SecurityIdentity;

public class AuthUtils {
    public static String getUserId(SecurityIdentity identity){
        return identity.getPrincipal().getName();
    }
}
