sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "loggingui5/model/models"
], function(UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("loggingui5.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup
         */
        init: function() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // create the views based on the url/hash
            this.getRouter().initialize();
        }
    });
});
