sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "loggingui5/model/models"
], function(Controller, JSONModel, models) {
    "use strict";

    return Controller.extend("loggingui5.controller.App", {
        onInit: function() {
            // Initialize models
            var oComponent = this.getOwnerComponent();
            oComponent.setModel(models.createLogsModel(), "logsModel");
            oComponent.setModel(models.createFiltersModel(), "filtersModel");
        }
    });
});
