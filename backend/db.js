const hana = require('@sap/hana-client');
const { Pool: PgPool } = require('pg');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const sslConfig = {
  ca: "-----BEGIN CERTIFICATE-----\nMIIDrzCCApegAwIBAgIQCDvgVpBCRrGhdWrJWZHHSjANBgkqhkiG9w0BAQUFADBh\nMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3\nd3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBD\nQTAeFw0wNjExMTAwMDAwMDBaFw0zMTExMTAwMDAwMDBaMGExCzAJBgNVBAYTAlVT\nMRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j\nb20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IENBMIIBIjANBgkqhkiG\n9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4jvhEXLeqKTTo1eqUKKPC3eQyaKl7hLOllsB\nCSDMAZOnTjC3U/dDxGkAV53ijSLdhwZAAIEJzs4bg7/fzTtxRuLWZscFs3YnFo97\nnh6Vfe63SKMI2tavegw5BmV/Sl0fvBf4q77uKNd0f3p4mVmFaG5cIzJLv07A6Fpt\n43C/dxC//AH2hdmoRBBYMql1GNXRor5H4idq9Joz+EkIYIvUX7Q6hL+hqkpMfT7P\nT19sdl6gSzeRntwi5m3OFBqOasv+zbMUZBfHWymeMr/y7vrTC0LUq7dBMtoM1O/4\ngdW7jVg/tRvoSSiicNoxBN33shbyTApOB6jtSj1etX+jkMOvJwIDAQABo2MwYTAO\nBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUA95QNVbR\nTLtm8KPiGxvDl7I90VUwHwYDVR0jBBgwFoAUA95QNVbRTLtm8KPiGxvDl7I90VUw\nDQYJKoZIhvcNAQEFBQADggEBAMucN6pIExIK+t1EnE9SsPTfrgT1eXkIoyQY/Esr\nhMAtudXH/vTBH1jLuG2cenTnmCmrEbXjcKChzUyImZOMkXDiqw8cvpOp/2PV5Adg\n06O/nVsJ8dWO41P0jmP6P6fbtGbfYmbW0W5BjfIttep3Sp+dWOIrWcBAI+0tKIJF\nPnlUkiaY4IBIqDfv8NZ5YBberOgOzW6sRBc4L0na4UU+Krk2U886UAb3LujEV0ls\nYSEY1QSteDwsOoBrp+uvFRTp2InBuThs4pFsiv9kuXclVzDAGySj4dzp30d8tbQk\nCAUw7C29C79Fv1C5qfPrmAESrciIxpg0X40KPMbp1ZWVbd4=\n-----END CERTIFICATE-----",
  rejectUnauthorized: process.env.MYSQL_REJECT_UNAUTHORIZED === 'true'
};

// HANA connection configuratio
const hanaConfig = {
  user: process.env.HANA_USER,
  password: process.env.HANA_PASSWORD,
  schema: process.env.HANA_SCHEMA,
  connectTimeout: 30000,
  port: process.env.HANA_PORT,
  host: process.env.HANA_HOST,
};

// Create HANA connection
let hanaConn = null;

// Function to connect to HANA
async function connectToHana() {
  try {
    if (hanaConn) {
      try {
        await new Promise((resolve, reject) => {
          hanaConn.disconnect((err) => {
            if (err) {
              console.error('Error disconnecting from HANA:', err);
            }
            resolve();
          });
        });
      } catch (err) {
        console.error('Error during disconnect:', err);
      }
    }

    hanaConn = hana.createConnection();
    
    await new Promise((resolve, reject) => {
      hanaConn.connect(hanaConfig, (err) => {
        if (err) {
          console.error('Error connecting to HANA:', err);
          hanaConn = null;
          reject(err);
        } else {
          console.log('Connected to HANA database successfully');
          resolve();
        }
      });
    });

    // Test the connection with a simple query
    await new Promise((resolve, reject) => {
      hanaConn.exec('SELECT 1 FROM DUMMY', (err, result) => {
        if (err) {
          console.error('Error testing HANA connection:', err);
          reject(err);
        } else {
          console.log('HANA connection test successful');
          resolve(result);
        }
      });
    });

  } catch (err) {
    console.error('Failed to connect to HANA:', err);
    hanaConn = null;
  }
}

// Connect to HANA on startup
connectToHana().catch(err => {
  console.error('Initial HANA connection failed:', err);
});

// PostgreSQL pool
const pgPool = new PgPool({
  "database": process.env.PG_SCHEMA,
  "host": process.env.PG_HOST,
  "password": process.env.PG_PASSWORD,
  "port": process.env.PG_PORT,
  "user": process.env.PG_USER,
  "options": "-c search_path=elsa_qa"
});

// MySQL pools
const mysqlPools = {
  mysql1: mysql.createPool({
    host: process.env.MYSQL1_HOST,
    user: process.env.MYSQL1_USER,
    password: process.env.MYSQL1_PASSWORD,
    database: process.env.MYSQL1_DATABASE,
    port: process.env.MYSQL1_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslConfig
  }),
  mysql2: mysql.createPool({
    host: process.env.MYSQL2_HOST,
    user: process.env.MYSQL2_USER,
    password: process.env.MYSQL2_PASSWORD,
    database: process.env.MYSQL2_DATABASE,
    port: process.env.MYSQL2_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslConfig
  }),
  mysql3: mysql.createPool({
    host: process.env.MYSQL3_HOST,
    user: process.env.MYSQL3_USER,
    password: process.env.MYSQL3_PASSWORD,
    database: process.env.MYSQL3_DATABASE,
    port: process.env.MYSQL3_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
};

function getDbConnection(db) {
  if (db === 'hana') {
    if (!hanaConn) {
      throw new Error('HANA connection not available');
    }
    return hanaConn;
  }
  if (db === 'pg') return pgPool;
  if (mysqlPools[db]) return mysqlPools[db];
  throw new Error('Unknown database');
}

// Test the connection
mysqlPools.mysql1.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

module.exports = { hanaConn, pgPool, mysqlPools, getDbConnection };
