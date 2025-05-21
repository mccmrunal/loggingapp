# Logging App UI5

This is an OpenUI5 version of the Logging App, replicating the functionality and UI of the React frontend.

## Features

- Display application logs in a sortable table
- Filter logs by multiple criteria:
  - Request text search
  - Component
  - Method
  - Status code
  - Date range
  - Response time range
- Toggle between light and dark themes
- Pagination support
- Multiple database selection

## Setup and Running

1. Install dependencies:
```
npm install
```

2. Start the UI5 application:
```
npm start
```

3. Open your browser and navigate to:
```
http://localhost:8080/index.html
```

## Project Structure

- `/webapp` - Main application folder
  - `/controller` - UI5 controllers
  - `/view` - XML views
  - `/model` - Data models and formatters
  - `/css` - Custom styling
  - `/i18n` - Internationalization

## Backend Connection

The application connects to the same backend REST API as the React version:

- Base URL: `http://localhost:5000`
- Endpoints:
  - `/logs` - Get logs with filtering and pagination
  - `/status-codes` - Get distinct status codes
  - `/methods` - Get distinct methods
  - `/components` - Get distinct components

## Notes

This application requires the backend server to be running on port 5000. Make sure the backend is up and running before starting this UI5 application.
