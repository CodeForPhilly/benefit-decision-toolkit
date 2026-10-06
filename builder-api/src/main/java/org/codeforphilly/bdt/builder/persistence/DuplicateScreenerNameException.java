package org.codeforphilly.bdt.builder.persistence;

public class DuplicateScreenerNameException extends RuntimeException {
    public DuplicateScreenerNameException() {
        super("You already have a screener with this name. Choose a different name.");
    }
}
