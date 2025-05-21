sap.ui.define([], function() {
    "use strict";

    return {
        /**
         * Format date objects to locale string
         * @param {string} dateString - ISO date string
         * @returns {string} Formatted date string
         */
        formatDate: function(dateString) {
            if (!dateString) {
                return "-";
            }
            try {
                return new Date(dateString).toLocaleString();
            } catch (e) {
                console.error("Error formatting date:", e);
                return dateString || "-";
            }
        },
        
        /**
         * Format date for API requests
         * @param {Date} date - Date object
         * @returns {string} ISO date string
         */
        formatDateForApi: function(date) {
            if (!date) {
                return null;
            }
            // Ensure 'date' is a Date object
            if (typeof date === 'string') {
                date = new Date(date);
            }
            if (!(date instanceof Date) || isNaN(date)) {
                console.error("Invalid date provided to formatDateForApi:", date);
                return null; 
            }

            const pad = (num) => num.toString().padStart(2, '0');

            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // Months are 0-indexed
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            const seconds = pad(date.getSeconds());

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },
        
        /**
         * Format HTTP status code to UI5 state
         * @param {string} status - HTTP status code
         * @returns {sap.ui.core.ValueState} UI5 state for status representation
         */
        formatStatusState: function(status) {
            if (!status) {
                return "None";
            }
            
            var iStatus = parseInt(status, 10);
            
            if (iStatus >= 200 && iStatus < 300) {
                return "Success"; // 2xx status codes
            } else if (iStatus >= 300 && iStatus < 400) {
                return "Information"; // 3xx status codes
            } else if (iStatus >= 400 && iStatus < 500) {
                return "Warning"; // 4xx status codes
            } else if (iStatus >= 500) {
                return "Error"; // 5xx status codes
            }
            
            return "None";
        }
    };
});
