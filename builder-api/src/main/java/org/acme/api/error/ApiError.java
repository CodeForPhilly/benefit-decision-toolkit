package org.acme.api.error;

public record ApiError(boolean error, String message) {
  public static ApiError of(String message) {
    return new ApiError(true, message);
  }
}
