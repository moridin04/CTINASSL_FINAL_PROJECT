// src/admin/components/Reports.js

import React, { useState, useEffect } from 'react';
import { applyThemeFromStorage } from '../utils/theme';
import {
  getReportHistory,
  getReportsMoviesPerMonth,
  getReportsUserGrowth,
  getReportsTopRatedMovies,
  generateReport,
  downloadReport,
  deleteReport
} from '../utils/api';
import {
  FiFileText, FiDownload, FiPrinter, FiFilter,
  FiCheckCircle, FiClock, FiCalendar, FiTrash2
} from "react-icons/fi";
import './Reports.css';

const Reports = () => {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  // --- State ---
  const [reportType, setReportType] = useState('top-rated-movies');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);

  // --- Analytics Data ---
  const [moviesPerMonth, setMoviesPerMonth] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);

  // --- Fetch history and analytics on mount ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setHistory(await getReportHistory());
        setMoviesPerMonth(await getReportsMoviesPerMonth());
        setUserGrowth(await getReportsUserGrowth());
        setTopRatedMovies(await getReportsTopRatedMovies());
      } catch (err) {
        setHistory([]);
        setMoviesPerMonth([]);
        setUserGrowth([]);
        setTopRatedMovies([]);
      }
    };
    loadData();
  }, []);

  // --- Handlers ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const reportPayload = {
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        format: exportFormat
      };
      const response = await generateReport(reportPayload);
      if (response && response.report) {
        setHistory([response.report, ...history]);
      }
    } catch (err) {
      alert('Failed to generate report.');
    }
    setIsGenerating(false);
  };

  const handleDownload = async (id, format = 'pdf') => {
    try {
      const blob = await downloadReport(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      let ext = format.toLowerCase();
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${id}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed for report ID ${id}`);
    }
  };

  // --- Selection Handlers ---
  const handleSelect = (id) => {
    setSelectedReports(selectedReports =>
      selectedReports.includes(id)
        ? selectedReports.filter(rid => rid !== id)
        : [...selectedReports, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === history.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(history.map(item => item._id || item.id));
    }
  };

  // --- Delete Handler ---
  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;
    if (!window.confirm(`Delete ${selectedReports.length} selected report(s)?`)) return;
    try {
      await Promise.all(selectedReports.map(id => deleteReport(id)));
      setHistory(history.filter(item => !selectedReports.includes(item._id || item.id)));
      setSelectedReports([]);
    } catch (err) {
      alert('Failed to delete selected reports.');
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>System Reports</h1>
        <p>Generate analytics, export data, and view historical logs.</p>
      </div>

      <div className="stats-row">
        <div className="mini-stat-card">
          <div className="icon-box purple"><FiFileText /></div>
          <div className="stat-info">
            <h3>Total Reports</h3>
            <p>{history.length}</p>
          </div>
        </div>
        <div className="mini-stat-card">
          <div className="icon-box blue"><FiDownload /></div>
          <div className="stat-info">
            <h3>Movies Added/Mo</h3>
            <p>{moviesPerMonth.length > 0 ? moviesPerMonth[moviesPerMonth.length-1].count : 0}</p>
          </div>
        </div>
        <div className="mini-stat-card">
          <div className="icon-box green"><FiPrinter /></div>
          <div className="stat-info">
            <h3>User Growth/Mo</h3>
            <p>{userGrowth.length > 0 ? userGrowth[userGrowth.length-1].count : 0}</p>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {/* Left: Generator Form */}
        <div className="report-card generator-card">
          <div className="card-header">
            <FiFilter className="card-icon" />
            <h3>Generate New Report</h3>
          </div>
          <form onSubmit={handleGenerate} className="report-form">
            <div className="form-group">
              <label>Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="top-rated-movies">Top Rated Movies</option>
                <option value="user-activity">User Activity</option>
                <option value="movies-added">Movies Added</option>
                <option value="user-growth">User Growth</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Range</label>
              <div className="date-inputs">
                <div className="input-wrapper start-date">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                    required
                  />
                </div>
                <span className="separator">to</span>
                <div className="input-wrapper end-date">
                  <FiCalendar className="input-icon" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Export Format</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="CSV">CSV Spreadsheet (.csv)</option>
                <option value="XLSX">Excel Workbook (.xlsx)</option>
              </select>
            </div>
            <button className="generate-btn" type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <><FiFileText /> Generate Report</>
              )}
            </button>
          </form>
        </div>

        {/* Right: History Table */}
        <div className="report-card history-card">
          <div className="card-header">
            <FiClock className="card-icon" />
            <h3>Recent History</h3>
          </div>
          <div className="table-actions">
            <button
              className="delete-btn"
              disabled={selectedReports.length === 0}
              onClick={handleDeleteSelected}
            >
              <FiTrash2 /> Delete Selected
            </button>
          </div>
          <div className="table-container">
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedReports.length === history.length && history.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Format</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state-cell">
                        <div className="empty-state-content">
                          <FiFileText className="empty-icon" />
                          <p>No reports generated yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => {
                      const id = item._id || item.id;
                      return (
                        <tr key={id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedReports.includes(id)}
                              onChange={() => handleSelect(id)}
                            />
                          </td>
                          <td className="font-medium">
                            <div className="file-name">
                              <div className="file-icon-circle"><FiFileText /></div>
                              {typeof item.name === 'string'
                                ? item.name
                                : item.name?.title || item.type || "Unnamed Report"}
                            </div>
                          </td>
                          <td>
                            {item.type
                              ? item.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : ''}
                          </td>
                          <td>
                            {item.date
                              ? new Date(item.date).toLocaleDateString()
                              : item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString()
                                : ''}
                          </td>
                          <td>
                            <span className={`badge-format format-${item.format?.toLowerCase() || ''}`}>
                              {item.format}
                            </span>
                          </td>
                          <td>
                            <span className="status-ready">
                              <FiCheckCircle /> {item.status || 'Ready'}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              className="download-btn"
                              onClick={() => handleDownload(id, item.format)}
                              title="Download"
                            >
                              <FiDownload />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
