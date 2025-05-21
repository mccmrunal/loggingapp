sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "../model/formatter",
    "../model/mockData",
    "../model/config"
], function(Controller, JSONModel, Filter, FilterOperator, Sorter, formatter, mockData, config) {
    "use strict";

    return Controller.extend("loggingui5.controller.Main", {
        formatter: formatter,
        
onInit: function () {
    // Initialize filters model
    this.filtersModel = new JSONModel({
        tempFilters: {},
        filters: {},
        selectedDb: config.defaultDatabase,
        databases: config.databases,
        theme: "light",
        showFilters: true
    });
    this.getView().setModel(this.filtersModel, "filters");

    // Initialize logs model
    this.logsModel = new JSONModel({
        logs: [],
        statusCodes: [],
        methods: [],
        components: [],
        pagination: {
            page: 1,
            pageSize: "20",
            totalItems: 0,
            totalPages: 0
        },
        pageSizes: [
            { key: "10", text: "10 per page" },
            { key: "20", text: "20 per page" },
            { key: "50", text: "50 per page" },
            { key: "100", text: "100 per page" }
        ],
        sortConfig: {
            field: "time",
            order: "desc"
        },
        columnConfig: {
            uuid: { label: "UUID", path: "UUID", visible: true },
            time: { label: "Time", path: "time", visible: true },
            component_name: { label: "Component", path: "component_name", visible: true },
            method: { label: "Method", path: "method", visible: true },
            organization_id: { label: "Org ID", path: "organization_id", visible: true },
            organization_name: { label: "Org Name", path: "organization_name", visible: true },
            request_received_at: { label: "Request Received", path: "request_received_at", visible: true },
            response_sent_at: { label: "Response Sent", path: "response_sent_at", visible: true },
            response_status: { label: "Status", path: "response_status", visible: true },
            response_time_ms: { label: "Resp Time (ms)", path: "response_time_ms", visible: true },
            space_id: { label: "Space ID", path: "space_id", visible: true },
            user_name: { label: "User", path: "user_name", visible: true },
            request_path: { label: "Request Path", path: "request_path", visible: true },
            request_query: { label: "Request Query", path: "request_query", visible: true },
            request_headers: { label: "Request Headers", path: "request_headers", visible: true },
            request_body: { label: "Request Body", path: "request_body", visible: true },
            response_headers: { label: "Response Headers", path: "response_headers", visible: true },
            response_body: { label: "Response Body", path: "response_body", visible: true },
            server_name: { label: "Server Name", path: "server_name", visible: true },
            request_host: { label: "Request Host", path: "request_host", visible: true },
            space_name: { label: "Space Name", path: "space_name", visible: true },
            trace_id: { label: "Trace ID", path: "trace_id", visible: true },
            request_id: { label: "Request ID", path: "request_id", visible: true },
            request_details: { label: "Request", path: "request", visible: true }, 
            written_at: { label: "Written At", path: "written_at", visible: true },
            protocol: { label: "Protocol", path: "protocol", visible: true }
        },
        loading: false,
        error: null
    });
    
    // Set a higher size limit for the model to handle larger datasets
    this.logsModel.setSizeLimit(1000);
    console.log("pageSizes before setModel:", JSON.parse(JSON.stringify(this.logsModel.getData().pageSizes))); // Log a deep copy
    this.getView().setModel(this.logsModel, "logsModel");

    // Apply theme from stored preference
    this._applyTheme(this.filtersModel.getProperty("/theme"));

    // Load data if a valid database is selected
    if (this.filtersModel.getProperty("/selectedDb")) {
        this._loadStatusCodes();
        this._loadMethods();
        this._loadComponents();
        this._loadLogs();
    }
},
        
        // Filter handling
        onFilterChange: function(oEvent) {
    var oSource = oEvent.getSource();
    var sFieldName = oSource.getCustomData()[0].getValue();
    var oValue;

    // Get value based on control type
    if (oSource.isA && oSource.isA("sap.m.Select")) {
        oValue = oSource.getSelectedKey();
        // If 'All' is selected (empty string), treat as undefined for filtering
        if (oValue === "") {
            oValue = undefined;
        }
    } else { // For Input, DateTimePicker, etc.
        oValue = oSource.getValue();
    }
    // Convert response time values to numbers
    if (sFieldName === "min_response_time_ms" || sFieldName === "max_response_time_ms") {
        oValue = oValue === "" ? "" : Number(oValue);
    }
    var oTempFilters = this.filtersModel.getProperty("/tempFilters");
    if (oValue === undefined) {
        delete oTempFilters[sFieldName];
    } else {
        oTempFilters[sFieldName] = oValue;
    }
    this.filtersModel.setProperty("/tempFilters", oTempFilters);
    console.log("Filter changed:", sFieldName, oValue, oTempFilters);
},
        
        onApplyFilters: function() {
    // Clean up response time filters
    var oTempFilters = jQuery.extend({}, this.filtersModel.getProperty("/tempFilters"));
    if (oTempFilters.min_response_time_ms === "") delete oTempFilters.min_response_time_ms;
    if (oTempFilters.max_response_time_ms === "") delete oTempFilters.max_response_time_ms;
    
    // Ensure min is not greater than max
    if (oTempFilters.min_response_time_ms && oTempFilters.max_response_time_ms) {
        if (oTempFilters.min_response_time_ms > oTempFilters.max_response_time_ms) {
            this.getView().getModel("logsModel").setProperty("/error", "Minimum response time cannot be greater than maximum response time");
            return;
        }
    }
    // Format date values for the backend
    if (oTempFilters.start_time) {
        oTempFilters.start_time = this.formatter.formatDateForApi(oTempFilters.start_time);
    }
    if (oTempFilters.end_time) {
        oTempFilters.end_time = this.formatter.formatDateForApi(oTempFilters.end_time);
    }
    // Apply filters
    this.filtersModel.setProperty("/filters", oTempFilters);
    console.log("Apply Filters: Sending filters to backend:", oTempFilters);
    // Reset to first page
    var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
    oPagination.page = 1;
    this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
    // Reload logs
    this._loadLogs();
},
        
        onClearFilters: function() {
            this.filtersModel.setProperty("/tempFilters", {});
            this.filtersModel.setProperty("/filters", {});

            // Reset dropdown selections
            this.byId("statusCodeDropdown").setSelectedKey(null);
            this.byId("methodDropdown").setSelectedKey(null);
            this.byId("componentDropdown").setSelectedKey(null);

            // Reset to first page
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            oPagination.page = 1;
            this.getView().getModel("logsModel").setProperty("/pagination", oPagination);

            // Reload logs
            this._loadLogs();
        },

        onPageSizeChange: function(oEvent) {
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            var sNewPageSize = oEvent.getParameter("selectedItem").getKey();
            
            oPagination.pageSize = parseInt(sNewPageSize, 10);
            oPagination.page = 1; // Reset to first page
            
            this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
            this._loadLogs();
        },
        
onDbChange: function(oEvent) {
    var sSelectedDb = oEvent.getSource().getSelectedKey();

    if (!sSelectedDb) {
        console.error("No database selected.");
        this.filtersModel.setProperty("/selectedDb", null);
        return;
    }

    this.filtersModel.setProperty("/selectedDb", sSelectedDb);

    // Reload data for the selected database
    this._loadStatusCodes();
    this._loadMethods();
    this._loadComponents();
    this._loadLogs();
},
        
        // Pagination handling
        onPreviousPage: function() {
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            if (oPagination.page > 1) {
                oPagination.page--;
                this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
                this._loadLogs();
            }
        },
        
        onFirstPage: function() {
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            if (oPagination.page > 1) {
                oPagination.page = 1;
                this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
                this._loadLogs();
            }
        },

        onLastPage: function() {
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            if (oPagination.page < oPagination.totalPages) {
                oPagination.page = oPagination.totalPages;
                this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
                this._loadLogs();
            }
        },

        onNextPage: function() {
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            if (oPagination.page < oPagination.totalPages) {
                oPagination.page++;
                this.getView().getModel("logsModel").setProperty("/pagination", oPagination);
                this._loadLogs();
            }
        },
        
        // UI controls
        onToggleFilters: function() {
            var bShowFilters = this.filtersModel.getProperty("/showFilters");
            this.filtersModel.setProperty("/showFilters", !bShowFilters);
        },
        
        onToggleTheme: function() {
            var sTheme = this.filtersModel.getProperty("/theme");
            var sNewTheme = sTheme === "light" ? "dark" : "light";
            this.filtersModel.setProperty("/theme", sNewTheme);
            this._applyTheme(sNewTheme);
        },
        
        onClearError: function() {
            this.getView().getModel("logsModel").setProperty("/error", null);
        },
        
        // Private methods
_loadStatusCodes: function() {
    var that = this;
    var sDb = this.filtersModel.getProperty("/selectedDb");

    if (!sDb) {
        console.error("Database is not selected.");
        return;
    }

    this.getView().getModel("logsModel").setProperty("/loading", true);
    fetch(config.backendUrl + "/status-codes?db=" + sDb, { timeout: config.requestTimeout })
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Failed to fetch status codes");
            }
            return response.json();
        })
        .then(function(data) {
            if (data.success) {
                var backendStatusCodes = data.data || [];
                var itemsForSelect = [{ key: "", text: "All Status Codes" }].concat(backendStatusCodes.map(function(sc) { return { key: sc, text: sc }; }));
                that.getView().getModel("logsModel").setProperty("/statusCodes", itemsForSelect);
                that.getView().getModel("logsModel").refresh(true);
            }
        })
        .catch(function(error) {
            console.warn("Using mock data for status codes:", error);
            that.getView().getModel("logsModel").setProperty("/statusCodes", mockData.statusCodes);
            that.getView().getModel("logsModel").refresh(true);
        })
        .finally(function() {
            that.getView().getModel("logsModel").setProperty("/loading", false);
        });
},
        
        _loadMethods: function() {
            var that = this;
            var sDb = this.filtersModel.getProperty("/selectedDb");
            
            if (!sDb) {
                console.error("Database is not selected.");
                return;
            }
            
            this.getView().getModel("logsModel").setProperty("/loading", true);
            console.log("Loading methods for DB:", sDb);
            
            fetch(config.backendUrl + "/methods?db=" + sDb, { timeout: config.requestTimeout })
                .then(function(response) {
                    console.log("Methods response:", response);
                    if (!response.ok) {
                        throw new Error("Failed to fetch methods");
                    }
                    return response.json();
                })
                .then(function(data) {
                    console.log("Methods data:", data);
                    if (data.success) {
                        var backendMethods = data.data || [];
                        var itemsForSelect = [{ key: "", text: "All Methods" }].concat(backendMethods.map(function(m) { return { key: m, text: m }; }));
                        that.getView().getModel("logsModel").setProperty("/methods", itemsForSelect);
                        console.log("Methods set in model (with All):", itemsForSelect);
                        that.getView().getModel("logsModel").refresh(true);
                    }
                })
                .catch(function(error) {
                    console.warn("Using mock data for methods:", error);
                    // Use mock data instead
                    that.getView().getModel("logsModel").setProperty("/methods", mockData.methods);
                    console.log("Methods set from mock data:", mockData.methods);
                    that.getView().getModel("logsModel").refresh(true);
                })
                .finally(function() {
                    that.getView().getModel("logsModel").setProperty("/loading", false);
                });
        },
        
        _loadComponents: function() {
            var that = this;
            var sDb = this.filtersModel.getProperty("/selectedDb");
            
            if (!sDb) {
                console.error("Database is not selected.");
                return;
            }
            
            this.getView().getModel("logsModel").setProperty("/loading", true);
            console.log("Loading components for DB:", sDb);
            
            fetch(config.backendUrl + "/components?db=" + sDb, { timeout: config.requestTimeout })
                .then(function(response) {
                    console.log("Components response:", response);
                    if (!response.ok) {
                        throw new Error("Failed to fetch components");
                    }
                    return response.json();
                })
                .then(function(data) {
                    console.log("Components data:", data);
                    if (data.success) {
                var backendComponents = data.data || [];
                var itemsForSelect = [{ key: "", text: "All Components" }].concat(backendComponents.map(function(c) { return { key: c, text: c }; }));
                that.getView().getModel("logsModel").setProperty("/components", itemsForSelect);
                console.log("Components set in model (with All):", itemsForSelect);
                that.getView().getModel("logsModel").refresh(true);
            }
                })
                .catch(function(error) {
                    console.warn("Using mock data for components:", error);
                    // Use mock data instead
                    that.getView().getModel("logsModel").setProperty("/components", mockData.components);
                    console.log("Components set from mock data:", mockData.components);
                    that.getView().getModel("logsModel").refresh(true);
                })
                .finally(function() {
                    that.getView().getModel("logsModel").setProperty("/loading", false);
                });
        },
        
        _loadLogs: function() {
            var that = this;
            var oFilters = this.filtersModel.getProperty("/filters");
            var oPagination = this.getView().getModel("logsModel").getProperty("/pagination");
            var oSortConfig = this.getView().getModel("logsModel").getProperty("/sortConfig");
            var sDb = this.filtersModel.getProperty("/selectedDb");
            
            if (!sDb) {
                console.error("Database is not selected.");
                this.getView().getModel("logsModel").setProperty("/error", "No database selected. Please select a database.");
                return;
            }
            
            this.getView().getModel("logsModel").setProperty("/loading", true);
            this.getView().getModel("logsModel").setProperty("/error", null);
            
            // Build URL params
            var oParams = new URLSearchParams({
                page: oPagination.page,
                pageSize: oPagination.pageSize,
                sortBy: config.sortFieldMapping[oSortConfig.field] || oSortConfig.field,
                sortOrder: oSortConfig.order,
                db: sDb
            });
            
            // Add filters
            Object.keys(oFilters).forEach(function(key) {
                oParams.append(key, oFilters[key]);
            });
            
            fetch(config.backendUrl + "/logs?" + oParams.toString(), { timeout: config.requestTimeout })
    .then(function(response) {
        if (!response.ok) {
            return response.json().then(function(errorData) {
                throw new Error(errorData.error?.message || "Failed to fetch logs");
            });
        }
        return response.json();
    })
    .then(function(data) {
        console.log("Logs data from API (filter response):", data);
        if (data.success) {
            console.log("Logs to set in model:", data.data.logs);
            var oModel = that.getView().getModel("logsModel");
            oModel.setProperty("/logs", data.data.logs);
            var backendPagination = data.data.pagination;
            console.log("Backend pagination data received:", backendPagination);
            var currentDefaultPageSize = that.getView().getModel("logsModel").getProperty("/pagination/pageSize") || 20;
            var parsedPagination = {
                page: parseInt(backendPagination.page, 10) || 1,
                pageSize: parseInt(backendPagination.pageSize, 10) || currentDefaultPageSize,
                totalItems: parseInt(backendPagination.totalItems, 10) || 0,
                totalPages: parseInt(backendPagination.totalPages, 10) || 0
            };
            // If totalPages wasn't provided by backend but totalItems and pageSize were, recalculate
            if (parsedPagination.totalPages === 0 && parsedPagination.totalItems > 0 && parsedPagination.pageSize > 0) {
                parsedPagination.totalPages = Math.ceil(parsedPagination.totalItems / parsedPagination.pageSize);
            }

            oModel.setProperty("/pagination", parsedPagination);
            // Debug the model after setting the data
            console.log("Model after update (real data - parsed):", oModel.getProperty("/pagination"));

            // Force model refresh
            oModel.refresh(true);
        } else {
            throw new Error("Invalid response format");
        }
    })
                .catch(function(error) {
                    console.warn("Using mock data for logs:", error);
                    // Display error to user
                    var oModel = that.getView().getModel("logsModel");
                    oModel.setProperty("/error", "Could not connect to the backend: " + error.message);
                    // Use mock data instead
                    oModel.setProperty("/logs", mockData.logs);
                    var totalMockItems = mockData.logs.length;
                    // Ensure pageSize for mock data defaults consistently, respecting current model value or 20
                    var currentModelPageSize = oModel.getProperty("/pagination/pageSize");
                    var mockPageSize = parseInt(currentModelPageSize, 10) || 20; 
                    var mockPagination = {
                        totalItems: parseInt(totalMockItems, 10) || 0,
                        page: 1, // Already a number
                        pageSize: mockPageSize, // Already parsed and defaulted
                        totalPages: Math.ceil((parseInt(totalMockItems, 10) || 0) / mockPageSize)
                    };
                    if (mockPagination.totalPages === 0 && mockPagination.totalItems > 0) mockPagination.totalPages = 1; // Ensure at least 1 page if items exist
                    oModel.setProperty("/pagination", mockPagination);
                    console.log("Mock pagination data set (parsed):", mockPagination);
                    console.log("Logs set from mock data:", mockData.logs);
                    oModel.refresh(true);
                })
                .finally(function() {
                    that.getView().getModel("logsModel").setProperty("/loading", false);
                });
        },
        
        onOpenColumnSelector: function () {
            var oView = this.getView();
            var oColumnConfig = this.logsModel.getProperty("/columnConfig");
            var aDialogColumns = [];

            // Create an array suitable for the dialog model, using the keys from columnConfig
            for (var sKey in oColumnConfig) {
                if (oColumnConfig.hasOwnProperty(sKey)) {
                    aDialogColumns.push({
                        key: sKey, // This is the actual key like 'uuid', 'time', etc.
                        label: oColumnConfig[sKey].label,
                        visible: oColumnConfig[sKey].visible
                    });
                }
            }

            var oDialogModel = new JSONModel({ columns: aDialogColumns });

            if (!this._oColumnSelectorDialog) {
                this._oColumnSelectorDialog = sap.ui.xmlfragment("loggingui5.view.ColumnSelectorDialog", this);
                oView.addDependent(this._oColumnSelectorDialog);
            }

            this._oColumnSelectorDialog.setModel(oDialogModel, "dialogModel");
            // The binding selected="{dialogModel>visible}" in the fragment should handle checkbox state.
            // Forcing a refresh on the dialog's model can sometimes help ensure bindings are updated immediately.
            // However, let's first try without it to keep it simple.
            // If issues persist, one might consider: oDialogModel.refresh(true);
            // or even: this._oColumnSelectorDialog.invalidate(); then this._oColumnSelectorDialog.rerender();
            
            this._oColumnSelectorDialog.open();
        },

        onColumnSelectorConfirm: function (oEvent) {
            console.log("onColumnSelectorConfirm function was called!"); // <-- ADDED THIS LINE
            var mParams = oEvent.getParameters();
            var oLogsModel = this.getView().getModel("logsModel");
            // It's good practice to get a fresh copy of columnConfig if modifying it in a loop,
            // but here we are setting properties on the model directly, which is fine.
            var currentColumnConfig = oLogsModel.getProperty("/columnConfig");

            console.log("ColumnSelectorConfirm event - mParams.filterKeys:", mParams.filterKeys);
            console.log("ColumnSelectorConfirm event - mParams.filterString:", mParams.filterString);

            // mParams.filterKeys itself is the object where keys are column keys and values are true if selected.
            // Example: { uuid: true, time: true, component_name: false, ... }
            // However, based on the log, it seems to only contain the *selected* keys with value true.
            // So, selectedKeysFromDialog will be mParams.filterKeys if it exists, otherwise an empty object.
            var selectedKeysFromDialog = (mParams.filterKeys && typeof mParams.filterKeys === 'object') ? mParams.filterKeys : {};
            console.log("Selected keys directly from mParams.filterKeys:", selectedKeysFromDialog);

            // Iterate through all columns defined in our logsModel's columnConfig
            for (var sColumnKeyInAppConfig in currentColumnConfig) {
                if (currentColumnConfig.hasOwnProperty(sColumnKeyInAppConfig)) {
                    // If the key from our app's config is in the set of selected keys from the dialog, it's visible.
                    var bIsVisible = !!selectedKeysFromDialog[sColumnKeyInAppConfig];
                    // console.log("Updating column '" + sColumnKeyInAppConfig + "' in logsModel to visible: " + bIsVisible);
                    oLogsModel.setProperty("/columnConfig/" + sColumnKeyInAppConfig + "/visible", bIsVisible);
                }
            }
            
            oLogsModel.refresh(true); // Crucial to update the table column bindings
            console.log("logsModel's columnConfig after update:", JSON.parse(JSON.stringify(oLogsModel.getProperty("/columnConfig"))));
            // Note: ViewSettingsDialog is not destroyed by default on confirm, which is fine for re-use.
        },

        _applyTheme: function(sTheme) {
            document.documentElement.setAttribute("data-theme", sTheme);
        }
    });
});
