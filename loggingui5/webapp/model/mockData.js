sap.ui.define([], function() {
    "use strict";

    return {
        statusCodes: [
            "200", "201", "204", "400", "401", "403", "404", "500", "503"
        ],
        
        methods: [
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ],
        
        components: [
            "API", "WebApp", "Database", "Authentication", "Frontend", "Backend"
        ],
        
        logs: [
            {
                "UUID": "aaaa-bbbb-cccc-dddd-1",
                "time": new Date().toISOString(),
                "component_name": "API",
                "method": "GET",
                "organization_id": "org-1",
                "organization_name": "Test Org 1",
                "request_received_at": new Date().toISOString(),
                "response_sent_at": new Date().toISOString(),
                "response_status": "200",
                "response_time_ms": 150,
                "space_id": "space-1",
                "space_name": "Test Space",
                "written_at": new Date().toISOString(),
                "protocol": "HTTP",
                "request": "/api/logs",
                "request_host": "localhost"
            },
            {
                "UUID": "aaaa-bbbb-cccc-dddd-2",
                "time": new Date().toISOString(),
                "component_name": "Database",
                "method": "POST",
                "organization_id": "org-2",
                "organization_name": "Test Org 2",
                "request_received_at": new Date().toISOString(),
                "response_sent_at": new Date().toISOString(),
                "response_status": "201",
                "response_time_ms": 220,
                "space_id": "space-2",
                "space_name": "Test Space 2",
                "written_at": new Date().toISOString(),
                "protocol": "HTTP",
                "request": "/api/data",
                "request_host": "localhost"
            },
            {
                "UUID": "aaaa-bbbb-cccc-dddd-3",
                "time": new Date().toISOString(),
                "component_name": "Authentication",
                "method": "POST",
                "organization_id": "org-1",
                "organization_name": "Test Org 1",
                "request_received_at": new Date().toISOString(),
                "response_sent_at": new Date().toISOString(),
                "response_status": "401",
                "response_time_ms": 75,
                "space_id": "space-1",
                "space_name": "Test Space",
                "written_at": new Date().toISOString(),
                "protocol": "HTTP",
                "request": "/api/auth",
                "request_host": "localhost"
            }
        ]
    };
});
