package org.acme.service;

import org.acme.model.Screener;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

public interface DmnService {
    public Map<String, Object> evaluateDecision(Screener screener, Map<String, Object> inputs) throws IOException;
}
