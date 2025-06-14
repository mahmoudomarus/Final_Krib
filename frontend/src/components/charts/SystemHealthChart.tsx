import React from 'react';
import InteractiveChart from './InteractiveChart';

interface SystemHealthData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
}

interface SystemHealthChartProps {
  data: SystemHealthData;
  height?: number;
}

const SystemHealthChart: React.FC<SystemHealthChartProps> = ({ data, height = 400 }) => {
  // Helper function to get color based on value and thresholds
  const getGaugeColor = (value: number, type: 'percentage' | 'time' = 'percentage') => {
    if (type === 'percentage') {
      if (value > 90) return '#EF4444'; // Red
      if (value > 75) return '#F59E0B'; // Orange
      if (value > 50) return '#10B981'; // Green
      return '#06B6D4'; // Light blue
    }
    // For response time - lower is better
    if (value > 1000) return '#EF4444'; // Red
    if (value > 500) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  // Create responsive gauge charts for each metric
  const gaugeData = [
    {
      type: 'indicator',
      mode: 'gauge+number',
      value: data.cpuUsage,
      domain: { x: [0, 0.48], y: [0.55, 1] },
      title: { 
        text: 'CPU Usage (%)',
        font: { size: 14, color: '#374151' }
      },
      gauge: {
        axis: { 
          range: [0, 100],
          tickcolor: '#9CA3AF',
          tickfont: { size: 10 }
        },
        bar: { 
          color: getGaugeColor(data.cpuUsage),
          thickness: 0.8
        },
        bgcolor: '#F3F4F6',
        borderwidth: 0,
        steps: [
          { range: [0, 50], color: '#E5E7EB' },
          { range: [50, 75], color: '#D1D5DB' },
          { range: [75, 90], color: '#9CA3AF' }
        ],
        threshold: {
          line: { color: '#EF4444', width: 3 },
          thickness: 0.8,
          value: 95
        }
      },
      number: {
        font: { size: 16, color: '#111827' },
        suffix: '%'
      }
    },
    {
      type: 'indicator',
      mode: 'gauge+number',
      value: data.memoryUsage,
      domain: { x: [0.52, 1], y: [0.55, 1] },
      title: { 
        text: 'Memory Usage (%)',
        font: { size: 14, color: '#374151' }
      },
      gauge: {
        axis: { 
          range: [0, 100],
          tickcolor: '#9CA3AF',
          tickfont: { size: 10 }
        },
        bar: { 
          color: getGaugeColor(data.memoryUsage),
          thickness: 0.8
        },
        bgcolor: '#F3F4F6',
        borderwidth: 0,
        steps: [
          { range: [0, 50], color: '#E5E7EB' },
          { range: [50, 75], color: '#D1D5DB' },
          { range: [75, 90], color: '#9CA3AF' }
        ],
        threshold: {
          line: { color: '#EF4444', width: 3 },
          thickness: 0.8,
          value: 95
        }
      },
      number: {
        font: { size: 16, color: '#111827' },
        suffix: '%'
      }
    },
    {
      type: 'indicator',
      mode: 'gauge+number',
      value: data.diskUsage,
      domain: { x: [0, 0.48], y: [0, 0.45] },
      title: { 
        text: 'Disk Usage (%)',
        font: { size: 14, color: '#374151' }
      },
      gauge: {
        axis: { 
          range: [0, 100],
          tickcolor: '#9CA3AF',
          tickfont: { size: 10 }
        },
        bar: { 
          color: getGaugeColor(data.diskUsage),
          thickness: 0.8
        },
        bgcolor: '#F3F4F6',
        borderwidth: 0,
        steps: [
          { range: [0, 50], color: '#E5E7EB' },
          { range: [50, 75], color: '#D1D5DB' },
          { range: [75, 90], color: '#9CA3AF' }
        ],
        threshold: {
          line: { color: '#EF4444', width: 3 },
          thickness: 0.8,
          value: 95
        }
      },
      number: {
        font: { size: 16, color: '#111827' },
        suffix: '%'
      }
    },
    {
      type: 'indicator',
      mode: 'number+delta',
      value: data.responseTime,
      domain: { x: [0.52, 1], y: [0.1, 0.35] },
      title: { 
        text: 'Response Time',
        font: { size: 14, color: '#374151' }
      },
      number: { 
        suffix: 'ms',
        font: { size: 18, color: getGaugeColor(data.responseTime, 'time') }
      },
      delta: { 
        reference: 200, 
        increasing: { color: '#EF4444' }, 
        decreasing: { color: '#10B981' },
        font: { size: 12 }
      }
    }
  ];

  const layout = {
    showlegend: false,
    margin: { l: 10, r: 10, t: 10, b: 10 },
    font: { 
      family: 'Inter, system-ui, sans-serif',
      size: 12,
      color: '#374151'
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Metrics</h3>
      <InteractiveChart
        data={gaugeData}
        height={height}
        layout={layout}
        showControls={false}
        className="w-full"
      />
    </div>
  );
};

export default SystemHealthChart; 