const express = require('express');
const cors = require('cors');
const { hanaConn, pgPool, mysqlPools, getDbConnection } = require('./db');
const { getQI, getQV, schema } = require('./sqlHelpers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
};

// Input validation middleware
const validateQueryParams = (req, res, next) => {
  try {
    const { page, pageSize, sortBy, sortOrder } = req.query;
    
    // Validate page and pageSize
    if (page && (isNaN(page) || page < 1)) {
      throw { status: 400, message: 'Invalid page number', code: 'INVALID_PAGE' };
    }
    if (pageSize && (isNaN(pageSize) || pageSize < 1 || pageSize > 100)) {
      throw { status: 400, message: 'Invalid page size', code: 'INVALID_PAGE_SIZE' };
    }

    // Validate sortBy
    const allowedSortFields = [
      'UUID', 'time', 'component_name', 'method', 'organization_id',
      'organization_name', 'request_received_at', 'response_sent_at',
      'response_status', 'response_time_ms', 'space_id', 'space_name',
      'written_at', 'protocol'
    ];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw { status: 400, message: 'Invalid sort field', code: 'INVALID_SORT_FIELD' };
    }

    // Validate sortOrder
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      throw { status: 400, message: 'Invalid sort order', code: 'INVALID_SORT_ORDER' };
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Helper to build WHERE clause
function buildWhereClause(filters, db) {
  const conditions = [];
  const params = [];

  if (filters.component_name) {
    conditions.push(`${getQI('component_name', db)} = ?`);
    params.push(filters.component_name);
  }

  if (filters.method) {
    conditions.push(`${getQI('method', db)} = ?`);
    params.push(filters.method);
  }

  if (filters.response_status) {
    conditions.push(`${getQI('response_status', db)} = ?`);
    params.push(filters.response_status);
  }

  if (filters.start_time) {
    conditions.push(`${getQI('time', db)} >= ?`);
    params.push(filters.start_time);
  }

  if (filters.end_time) {
    conditions.push(`${getQI('time', db)} <= ?`);
    params.push(filters.end_time);
  }

  if (filters.min_response_time) {
    conditions.push(`${getQI('response_time', db)} >= ?`);
    params.push(filters.min_response_time);
  }

  if (filters.max_response_time) {
    conditions.push(`${getQI('response_time', db)} <= ?`);
    params.push(filters.max_response_time);
  }

  // Add request search condition
  if (filters.request_search) {
    conditions.push(`${getQI('request', db)} LIKE ?`);
    params.push(`%${filters.request_search}%`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

async function queryLogs(db, sql, params) {
  if (db === 'hana') {
    return new Promise((resolve, reject) => {
      hanaConn.exec(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  } else if (db === 'pg') {
    const { rows } = await pgPool.query(sql, params);
    return rows;
  } else if (mysqlPools[db]) {
    const [results] = await mysqlPools[db].execute(sql, params);
    return results;
  } else {
    throw new Error('Unknown database');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/logs', validateQueryParams, async (req, res, next) => {
  try {
    const db = req.query.db || 'mysql1';
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const sortBy = req.query.sortBy || 'time';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const { whereClause, params } = buildWhereClause(req.query, db);

    const table = `${schema(db)}.${getQI('peps.application_logs', db)}`;
    const quotedSortBy = getQI(sortBy, db);

    let countSql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    let logsSql = `SELECT ${getQI('UUID', db)}, ${getQI('time', db)}, ${getQI('component_name', db)}, ${getQI('method', db)}, ${getQI('organization_id', db)}, ${getQI('organization_name', db)}, ${getQI('protocol', db)}, ${getQI('request', db)}, ${getQI('request_host', db)}, ${getQI('request_received_at', db)}, ${getQI('response_sent_at', db)}, ${getQI('response_status', db)}, ${getQI('response_time_ms', db)}, ${getQI('space_id', db)}, ${getQI('space_name', db)}, ${getQI('written_at', db)} FROM ${table} ${whereClause} ORDER BY ${quotedSortBy} ${sortOrder} LIMIT ${pageSize} OFFSET ${offset}`;

    // Count total
    const countRows = await queryLogs(db, countSql, params);
    const total = countRows[0].count;

    // Fetch logs
    const rows = await queryLogs(db, logsSql, params);

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// Add new endpoint for distinct status codes
app.get('/status-codes', async (req, res, next) => {
  try {
    const db = req.query.db || 'mysql1';
    const table = `${schema(db)}.${getQI('peps.application_logs', db)}`;
    const rows = await queryLogs(db,
      `SELECT DISTINCT ${getQI('response_status', db)} 
       FROM ${table} 
       WHERE ${getQI('response_status', db)} IS NOT NULL 
       ORDER BY ${getQI('response_status', db)}`,
      []
    );
    res.json({
      success: true,
      data: rows.map(row => row.response_status)
    });
  } catch (err) {
    next(err);
  }
});

// Add new endpoint for distinct methods
app.get('/methods', async (req, res, next) => {
  try {
    const db = req.query.db || 'mysql1';
    const table = `${schema(db)}.${getQI('peps.application_logs', db)}`;
    const rows = await queryLogs(db,
      `SELECT DISTINCT ${getQI('method', db)} 
       FROM ${table} 
       WHERE ${getQI('method', db)} IS NOT NULL 
       ORDER BY ${getQI('method', db)}`,
      []
    );
    res.json({
      success: true,
      data: rows.map(row => row.method)
    });
  } catch (err) {
    next(err);
  }
});

// Add new endpoint for distinct components
app.get('/components', async (req, res, next) => {
  try {
    const db = req.query.db || 'mysql1';
    const table = `${schema(db)}.${getQI('peps.application_logs', db)}`;
    const rows = await queryLogs(db,
      `SELECT DISTINCT ${getQI('component_name', db)} 
       FROM ${table} 
       WHERE ${getQI('component_name', db)} IS NOT NULL 
       ORDER BY ${getQI('component_name', db)}`,
      []
    );
    res.json({
      success: true,
      data: rows.map(row => row.component_name)
    });
  } catch (err) {
    next(err);
  }
});

// Apply error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});