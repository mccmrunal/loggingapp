sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function(JSONModel, Device) {
    "use strict";

    return {
        createDeviceModel: function() {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createLogsModel: function() {
            var oModel = new JSONModel({
                logs: [],
                pagination: {
                    total: 0,
                    page: 1,
                    pageSize: 20,
                    totalPages: 0
                },
                loading: false,
                error: null,
                sortConfig: { field: "time", order: "desc" },
                statusCodes: [],
                methods: [],
                components: []
            });
            return oModel;
        },

        createFiltersModel: function() {
            var oModel = new JSONModel({
                filters: {},
                tempFilters: {
                    component_name: "",
                    method: "",
                    response_status: "",
                    request_search: "",
                    min_response_time_ms: "",
                    max_response_time_ms: ""
                },
                selectedDb: "mysql1", 
                showFilters: true,
                theme: "dark",
                databases: [
                    { id: "mysql1", name: "QA-MYSQL" },
                    { id: "mysql2", name: "PREPROD-MYSQL" },
                    { id: "mysql3", name: "OVH-MYSQL" },
                    { id: "pg", name: "PostgreSQL" },
                    { id: "hana", name: "HANA" }
                ]
            });
            return oModel;
        }
    };
});
