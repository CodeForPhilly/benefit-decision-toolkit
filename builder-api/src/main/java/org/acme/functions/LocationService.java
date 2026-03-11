package org.acme.functions;

import io.quarkus.arc.Arc;
import io.quarkus.arc.Unremovable;
import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Unremovable
@ApplicationScoped
public class LocationService {

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
        Map<String, Object> normalised = new java.util.LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            String raw = entry.getValue().toString().trim();
            // Strip trailing period so "Mont." becomes "Mont%" for LIKE matching
            String pattern = raw.endsWith(".") ? raw.substring(0, raw.length() - 1) + "%" : raw + "%";
            normalised.put(entry.getKey(), pattern);
        }
        return lookupWithOperator(column, normalised, "LIKE ? COLLATE NOCASE");
    }

    public static List<String> lookup(String column, Map<String, Object> filters) {
        return lookupWithOperator(column, filters, "= ? COLLATE NOCASE");
    }

    private static List<String> lookupWithOperator(String column, Map<String, Object> filters, String operator) {
        List<String> results = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT DISTINCT ").append(column).append(" FROM locations WHERE ");

        // construct WHERE clause; assume everything is ANDed together
        boolean first = true;
        for (String key : filters.keySet()) {
            if (!first) {
                sql.append(" AND ");
            }
            sql.append(key).append(" ").append(operator);
            first = false;
        }

        LocationService service = Arc.container().instance(LocationService.class).get();

        Connection connection = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            connection = service.getDbConnection();
            pstmt = connection.prepareStatement(sql.toString());

            // Set the values dynamically
            int index = 1;
            for (Object value : filters.values()) {
                String stringValue = value.toString().trim(); // db only has strings
                pstmt.setString(index++, stringValue);
            }

            rs = pstmt.executeQuery();

            while(rs.next()) {
                String thisString = rs.getString(column);
                results.add(thisString);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            try {
                if (rs != null) {
                    rs.close();
                }
                if (pstmt != null) {
                    pstmt.close();
                }
                if (connection != null) {
                    connection.close();
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }

        return results;
    }
}
