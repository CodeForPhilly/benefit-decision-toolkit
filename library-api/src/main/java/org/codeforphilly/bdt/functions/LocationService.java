package org.codeforphilly.bdt.functions;

import io.quarkus.arc.Arc;
import javax.enterprise.context.ApplicationScoped;
import io.quarkus.arc.Unremovable;
import javax.inject.Inject;
import io.agroal.api.AgroalDataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Unremovable
@ApplicationScoped
public class LocationService {

    private static final Logger LOG = Logger.getLogger(LocationService.class.getName());

    @Inject
    AgroalDataSource dataSource;

    public Connection getDbConnection() throws SQLException {
        return dataSource.getConnection();
    }

    /**
     * Like {@link #lookup}, but matches filter values as case-insensitive prefix patterns.
     * Trailing periods are stripped so abbreviations like "Mont." match "Montgomery".
     */
    public static List<String> lookupFuzzy(String column, Map<String, Object> filters) {
        Map<String, Object> patterns = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            String raw = entry.getValue().toString().trim();
            // Strip trailing period so "Mont." becomes "Mont%" for LIKE matching
            String pattern = raw.endsWith(".") ? raw.substring(0, raw.length() - 1) + "%" : raw + "%";
            patterns.put(entry.getKey(), pattern);
        }
        return query(column, patterns, "LIKE");
    }

    public static List<String> lookup(String column, Map<String, Object> filters) {
        return query(column, filters, "=");
    }

    private static final java.util.Set<String> ALLOWED_COLUMNS = java.util.Set.of(
            "zipCode", "countyName", "stateAbbreviation", "stateName"
    );

    private static List<String> query(String column, Map<String, Object> filters, String operator) {
        if (!ALLOWED_COLUMNS.contains(column)) {
            throw new IllegalArgumentException("Invalid column: " + column);
        }
        for (String key : filters.keySet()) {
            if (!ALLOWED_COLUMNS.contains(key)) {
                throw new IllegalArgumentException("Invalid filter key: " + key);
            }
        }

        List<String> results = new ArrayList<>();

        StringBuilder sql = new StringBuilder("SELECT DISTINCT ").append(column).append(" FROM locations WHERE ");
        boolean first = true;
        for (String key : filters.keySet()) {
            if (!first) sql.append(" AND ");
            sql.append(key).append(" ").append(operator).append(" ? COLLATE NOCASE");
            first = false;
        }

        LocationService service = Arc.container().instance(LocationService.class).get();

        try (Connection connection = service.getDbConnection();
             PreparedStatement pstmt = connection.prepareStatement(sql.toString())) {

            int index = 1;
            for (Object value : filters.values()) {
                pstmt.setString(index++, value.toString().trim());
            }

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    results.add(rs.getString(column));
                }
            }

        } catch (SQLException e) {
            LOG.severe("Location lookup failed for column=" + column + " filters=" + filters + ": " + e.getMessage());
            throw new RuntimeException("Location lookup failed", e);
        }

        return results;
    }
}
