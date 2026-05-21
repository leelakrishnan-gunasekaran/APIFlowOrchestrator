import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { executionService } from '../services/api';
import './PerformanceHeatmap.css';

const PerformanceHeatmap = ({ groupId }) => {
  const [timeRange, setTimeRange] = useState('recent'); // recent, all

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['executionRuns', groupId, timeRange],
    queryFn: async () => {
      const response = timeRange === 'recent' 
        ? await executionService.getRecentRuns(groupId)
        : await executionService.getRunsByGroup(groupId);
      return response.data;
    },
  });

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (!runs || runs.length === 0) return null;

    const apiPerformance = {};
    
    runs.forEach(run => {
      if (run.results) {
        run.results.forEach(result => {
          const apiName = result.apiNodeName;
          if (!apiPerformance[apiName]) {
            apiPerformance[apiName] = {
              name: apiName,
              durations: [],
              successCount: 0,
              failCount: 0,
            };
          }
          
          apiPerformance[apiName].durations.push(result.durationMs);
          if (result.status === 'SUCCESS') {
            apiPerformance[apiName].successCount++;
          } else {
            apiPerformance[apiName].failCount++;
          }
        });
      }
    });

    // Calculate statistics for each API
    const metrics = Object.values(apiPerformance).map(api => {
      const durations = api.durations.sort((a, b) => a - b);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const min = durations[0];
      const max = durations[durations.length - 1];
      const median = durations[Math.floor(durations.length / 2)];
      
      // Calculate baseline (average of first 5 runs or all if less)
      const baselineDurations = durations.slice(0, Math.min(5, durations.length));
      const baseline = baselineDurations.reduce((sum, d) => sum + d, 0) / baselineDurations.length;
      
      // Calculate performance change
      const recentDurations = durations.slice(-5);
      const recentAvg = recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length;
      const changePercent = ((recentAvg - baseline) / baseline) * 100;
      
      return {
        name: api.name,
        avg: Math.round(avg),
        min,
        max,
        median: Math.round(median),
        baseline: Math.round(baseline),
        recentAvg: Math.round(recentAvg),
        changePercent: Math.round(changePercent),
        successRate: (api.successCount / (api.successCount + api.failCount)) * 100,
        totalRuns: api.successCount + api.failCount,
      };
    });

    return metrics;
  };

  const metrics = calculateMetrics();

  const getPerformanceColor = (changePercent) => {
    if (changePercent <= -10) return '#10b981'; // Much faster - green
    if (changePercent <= 0) return '#84cc16'; // Faster - lime
    if (changePercent <= 10) return '#fbbf24'; // Slightly slower - yellow
    if (changePercent <= 25) return '#f97316'; // Slower - orange
    return '#ef4444'; // Much slower - red
  };

  const getPerformanceLabel = (changePercent) => {
    if (changePercent <= -10) return 'Much Faster';
    if (changePercent <= 0) return 'Faster';
    if (changePercent <= 10) return 'Baseline';
    if (changePercent <= 25) return 'Slower';
    return 'Much Slower';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <div className="tooltip-content">
            <p><strong>Average:</strong> {data.avg}ms</p>
            <p><strong>Min:</strong> {data.min}ms</p>
            <p><strong>Max:</strong> {data.max}ms</p>
            <p><strong>Baseline:</strong> {data.baseline}ms</p>
            <p><strong>Recent Avg:</strong> {data.recentAvg}ms</p>
            <p><strong>Change:</strong> {data.changePercent > 0 ? '+' : ''}{data.changePercent}%</p>
            <p><strong>Success Rate:</strong> {data.successRate.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="loading">Loading performance data...</div>;
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="performance-heatmap empty">
        <div className="empty-state">
          <Activity size={48} className="empty-icon" />
          <h3>No Performance Data</h3>
          <p>Execute your API flow multiple times to see performance trends</p>
        </div>
      </div>
    );
  }

  // Calculate overall statistics
  const overallAvg = Math.round(metrics.reduce((sum, m) => sum + m.avg, 0) / metrics.length);
  const overallChange = Math.round(metrics.reduce((sum, m) => sum + m.changePercent, 0) / metrics.length);
  const slowestAPI = metrics.reduce((max, m) => m.avg > max.avg ? m : max, metrics[0]);
  const fastestAPI = metrics.reduce((min, m) => m.avg < min.avg ? m : min, metrics[0]);

  return (
    <div className="performance-heatmap">
      <div className="heatmap-header">
        <div className="header-left">
          <h3>Performance Heatmap</h3>
          <p>Baseline comparison and trends</p>
        </div>
        <div className="header-right">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="recent">Recent (10 runs)</option>
            <option value="all">All Runs</option>
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="overall-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Response Time</span>
            <span className="stat-value">{overallAvg}ms</span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${overallChange > 0 ? 'negative' : 'positive'}`}>
            {overallChange > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="stat-content">
            <span className="stat-label">Overall Change</span>
            <span className={`stat-value ${overallChange > 0 ? 'negative' : 'positive'}`}>
              {overallChange > 0 ? '+' : ''}{overallChange}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon positive">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Fastest API</span>
            <span className="stat-value">{fastestAPI.name}</span>
            <span className="stat-subtext">{fastestAPI.avg}ms</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon negative">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Slowest API</span>
            <span className="stat-value">{slowestAPI.name}</span>
            <span className="stat-subtext">{slowestAPI.avg}ms</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="chart-container">
        <h4>Response Time Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              interval={0}
            />
            <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="avg" name="Average" radius={[8, 8, 0, 0]}>
              {metrics.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.changePercent)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Table */}
      <div className="performance-table">
        <h4>Detailed Performance Metrics</h4>
        <table>
          <thead>
            <tr>
              <th>API Name</th>
              <th>Avg (ms)</th>
              <th>Min (ms)</th>
              <th>Max (ms)</th>
              <th>Baseline (ms)</th>
              <th>Change</th>
              <th>Status</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td className="api-name">{metric.name}</td>
                <td>{metric.avg}</td>
                <td className="positive">{metric.min}</td>
                <td className="negative">{metric.max}</td>
                <td>{metric.baseline}</td>
                <td className={metric.changePercent > 10 ? 'negative' : 'positive'}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                </td>
                <td>
                  <span 
                    className="performance-badge"
                    style={{ backgroundColor: getPerformanceColor(metric.changePercent) }}
                  >
                    {getPerformanceLabel(metric.changePercent)}
                  </span>
                </td>
                <td>
                  <span className={metric.successRate >= 90 ? 'positive' : 'negative'}>
                    {metric.successRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="performance-legend">
        <h4>Performance Status Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            <span>Much Faster ({'<'} -10%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#84cc16' }}></span>
            <span>Faster (0% to -10%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#fbbf24' }}></span>
            <span>Baseline (0% to +10%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f97316' }}></span>
            <span>Slower (+10% to +25%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Much Slower ({'>'} +25%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHeatmap;

// Made with Bob
