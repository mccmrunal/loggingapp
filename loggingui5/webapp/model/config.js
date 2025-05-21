sap.ui.define([], function () {
    "use strict";

    return {
        // Backend API URL configuration
        backendUrl: "http://localhost:5000",
        
        // Available databases for selection
        databases: [
            { id: "mysql1", name: "MySQL 1" },
            { id: "mysql2", name: "MySQL 2" },
            { id: "pg", name: "PostgreSQL" },
            { id: "hana", name: "SAP HANA" }
        ],
        
        // Default database to use
        defaultDatabase: "mysql1",
        
        // API request timeout in milliseconds
        requestTimeout: 5000,
        
        // Map UI field names to backend field names for sorting
        sortFieldMapping: {
            "timestamp": "time",
            "UUID": "UUID",
            "time": "time",
            "component_name": "component_name",
            "method": "method",
            "organization_id": "organization_id",
            "organization_name": "organization_name",
            "request_received_at": "request_received_at",
            "response_sent_at": "response_sent_at",
            "response_status": "response_status",
            "response_time_ms": "response_time_ms",
            "space_id": "space_id",
            "space_name": "space_name",
            "written_at": "written_at",
            "protocol": "protocol"
        }
    };
});
