import React from 'react';

function LogTable({ logs, loading, onSort, sortConfig }) {
  if (loading) return <div className="loading">Loading logs...</div>;
  if (!logs.length) return <div className="no-data">No logs found.</div>;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return '↕';
    return sortConfig.order === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-container">
      <table className="log-table">
        <thead>
          <tr>
            <th onClick={() => onSort('UUID')}>
              UUID {getSortIcon('UUID')}
            </th>
            <th onClick={() => onSort('time')}>
              Time {getSortIcon('time')}
            </th>
            <th onClick={() => onSort('component_name')}>
              Component {getSortIcon('component_name')}
            </th>
            <th onClick={() => onSort('method')}>
              Method {getSortIcon('method')}
            </th>
            <th onClick={() => onSort('organization_id')}>
              Org ID {getSortIcon('organization_id')}
            </th>
            <th onClick={() => onSort('organization_name')}>
              Org Name {getSortIcon('organization_name')}
            </th>
            <th onClick={() => onSort('request_received_at')}>
              Request Received {getSortIcon('request_received_at')}
            </th>
            <th onClick={() => onSort('response_sent_at')}>
              Response Sent {getSortIcon('response_sent_at')}
            </th>
            <th onClick={() => onSort('response_status')}>
              Status {getSortIcon('response_status')}
            </th>
            <th onClick={() => onSort('response_time_ms')}>
              Resp Time (ms) {getSortIcon('response_time_ms')}
            </th>
            <th onClick={() => onSort('space_id')}>
              Space ID {getSortIcon('space_id')}
            </th>
            <th onClick={() => onSort('space_name')}>
              Space Name {getSortIcon('space_name')}
            </th>
            <th onClick={() => onSort('written_at')}>
              Written At {getSortIcon('written_at')}
            </th>
            <th onClick={() => onSort('protocol')}>
              Protocol {getSortIcon('protocol')}
            </th>
            <th>Request</th>
            <th>Request Host</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.UUID}>
              <td className="uuid-cell">{log.UUID}</td>
              <td>{formatDate(log.time)}</td>
              <td>{log.component_name}</td>
              <td>{log.method}</td>
              <td>{log.organization_id}</td>
              <td>{log.organization_name}</td>
              <td>{formatDate(log.request_received_at)}</td>
              <td>{formatDate(log.response_sent_at)}</td>
              <td className={`status-${log.response_status}`}>{log.response_status}</td>
              <td>{log.response_time_ms}</td>
              <td>{log.space_id}</td>
              <td>{log.space_name}</td>
              <td>{formatDate(log.written_at)}</td>
              <td>{log.protocol}</td>
              <td className="request-cell">{log.request}</td>
              <td>{log.request_host}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LogTable; 