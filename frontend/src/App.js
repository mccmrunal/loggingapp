import React, { useState, useEffect } from 'react';
import LogTable from './components/LogTable';
import './App.css';

// Available databases
const DATABASES = [
  { id: 'mysql1', name: 'QA-MYSQL' },
  { id: 'mysql2', name: 'PREPROD-MYSQL' },
  { id: 'mysql3', name: 'OVH-MYSQL' },
  { id: 'pg', name: 'PostgreSQL' },
  { id: 'hana', name: 'HANA' }
];

function App() {
  const [filters, setFilters] = useState({});
  const [tempFilters, setTempFilters] = useState({}); // Temporary filters before applying
  const [selectedDb, setSelectedDb] = useState('mysql1'); // Default database
  const [logs, setLogs] = useState([]);
  const [statusCodes, setStatusCodes] = useState([]);
  const [methods, setMethods] = useState([]);
  const [components, setComponents] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'time', order: 'desc' });
  const [showFilters, setShowFilters] = useState(true);
  const [theme, setTheme] = useState('dark');

  // Theme toggle effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch distinct status codes
  useEffect(() => {
    async function fetchStatusCodes() {
      try {
        const res = await fetch(`http://localhost:5000/status-codes?db=${selectedDb}`);
        if (!res.ok) {
          throw new Error('Failed to fetch status codes');
        }
        const data = await res.json();
        if (data.success) {
          setStatusCodes(data.data);
        }
      } catch (err) {
        console.error('Error fetching status codes:', err);
      }
    }
    fetchStatusCodes();
  }, [selectedDb]);

  // Fetch distinct methods
  useEffect(() => {
    async function fetchMethods() {
      try {
        const res = await fetch(`http://localhost:5000/methods?db=${selectedDb}`);
        if (!res.ok) {
          throw new Error('Failed to fetch methods');
        }
        const data = await res.json();
        if (data.success) {
          setMethods(data.data);
        }
      } catch (err) {
        console.error('Error fetching methods:', err);
      }
    }
    fetchMethods();
  }, [selectedDb]);

  // Fetch components
  useEffect(() => {
    async function fetchComponents() {
      try {
        const res = await fetch(`http://localhost:5000/components?db=${selectedDb}`);
        if (!res.ok) {
          throw new Error('Failed to fetch components');
        }
        const data = await res.json();
        if (data.success) {
          setComponents(data.data);
        }
      } catch (err) {
        console.error('Error fetching components:', err);
      }
    }
    fetchComponents();
  }, [selectedDb]);

  // Fetch logs from backend
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          ...filters,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: sortConfig.field,
          sortOrder: sortConfig.order,
          db: selectedDb
        });
        
        const res = await fetch(`http://localhost:5000/logs?${params.toString()}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || 'Failed to fetch logs');
        }
        const data = await res.json();
        if (data.success) {
          setLogs(data.data.logs);
          setPagination(data.data.pagination);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch logs');
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [filters, pagination.page, pagination.pageSize, sortConfig, selectedDb]);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (field, value) => {
    // Convert response time values to numbers
    if (field === 'min_response_time_ms' || field === 'max_response_time_ms') {
      value = value === '' ? '' : Number(value);
    }
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    // Clean up response time filters before applying
    const cleanedFilters = { ...tempFilters };
    if (cleanedFilters.min_response_time_ms === '') delete cleanedFilters.min_response_time_ms;
    if (cleanedFilters.max_response_time_ms === '') delete cleanedFilters.max_response_time_ms;
    
    // Ensure min is not greater than max
    if (cleanedFilters.min_response_time_ms && cleanedFilters.max_response_time_ms) {
      if (cleanedFilters.min_response_time_ms > cleanedFilters.max_response_time_ms) {
        setError('Minimum response time cannot be greater than maximum response time');
        return;
      }
    }

    // Log the filters for debugging
    console.log('Applying filters:', cleanedFilters);

    setFilters(cleanedFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleDateRangeChange = (startDate, endDate) => {
    setTempFilters(prev => ({
      ...prev,
      start_time: startDate,
      end_time: endDate
    }));
  };

  const clearFilters = () => {
    setTempFilters({});
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Application Logs Viewer</h1>
          <p className="header-subtitle">Monitor and analyze your application logs in real-time</p>
        </div>
        <div className="header-controls">
          <select 
            className="db-selector"
            value={selectedDb}
            onChange={(e) => setSelectedDb(e.target.value)}
          >
            {DATABASES.map(db => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
          <button 
            className="toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="icon">{showFilters ? '🔍' : '🔎'}</span>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
          >
            <span className="icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showFilters && (
        <div className="filters-container">
          <form
            className="filters-bar clean-filters"
            onSubmit={e => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="filter-row">
              <div className="filter-group">
                <label>🔍 Request</label>
                <input
                  type="text"
                  value={tempFilters.request_search || ''}
                  onChange={e => handleFilterChange('request_search', e.target.value)}
                  className="filter-input"
                  placeholder="Search in request..."
                />
              </div>
              <div className="filter-group">
                <label>⚡ Component</label>
                <select
                  value={tempFilters.component_name || ''}
                  onChange={e => handleFilterChange('component_name', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {components.map(component => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>🔄 Method</label>
                <select
                  value={tempFilters.method || ''}
                  onChange={e => handleFilterChange('method', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {methods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>📊 Status</label>
                <select
                  value={tempFilters.response_status || ''}
                  onChange={e => handleFilterChange('response_status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All</option>
                  {statusCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>From</label>
                <input
                  type="datetime-local"
                  value={tempFilters.start_time || ''}
                  onChange={e => handleDateRangeChange(e.target.value, tempFilters.end_time)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>To</label>
                <input
                  type="datetime-local"
                  value={tempFilters.end_time || ''}
                  onChange={e => handleDateRangeChange(tempFilters.start_time, e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Min RT (ms)</label>
                <input
                  type="number"
                  value={tempFilters.min_response_time_ms || ''}
                  onChange={e => handleFilterChange('min_response_time_ms', e.target.value)}
                  className="filter-input"
                  placeholder="Min"
                  min="0"
                />
              </div>
              <div className="filter-group">
                <label>Max RT (ms)</label>
                <input
                  type="number"
                  value={tempFilters.max_response_time_ms || ''}
                  onChange={e => handleFilterChange('max_response_time_ms', e.target.value)}
                  className="filter-input"
                  placeholder="Max"
                  min="0"
                />
              </div>
              <div className="filter-actions">
                <button type="submit" className="apply-filters">
                  ✨ Apply
                </button>
                <button type="button" className="clear-filters" onClick={clearFilters}>
                  🗑️ Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <LogTable 
          logs={logs} 
          loading={loading} 
          onSort={handleSort}
          sortConfig={sortConfig}
        />
      </div>

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || loading}
          className="pagination-button"
        >
          <span className="icon">←</span>
          Previous
        </button>
        <span className="page-info">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages || loading}
          className="pagination-button"
        >
          Next
          <span className="icon">→</span>
        </button>
        <select 
          value={pagination.pageSize} 
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="page-size-select"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>
    </div>
  );
}

export default App;
