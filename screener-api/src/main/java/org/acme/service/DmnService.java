package org.acme.service;

import org.acme.model.ResultDetail;
import org.acme.model.Screener;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface DmnService {
    public List<ResultDetail> evaluateDecision(Screener screener, Map<String, Object> inputs) throws IOException;
}
