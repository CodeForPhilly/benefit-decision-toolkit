package org.acme.persistence;

public class DocumentAlreadyExistsException extends Exception {

    public DocumentAlreadyExistsException(String documentId, Throwable cause) {
        super("Document already exists: " + documentId, cause);
    }
}
