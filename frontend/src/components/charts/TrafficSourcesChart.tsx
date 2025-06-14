import React from 'react';
import InteractiveChart from './InteractiveChart';

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

interface TrafficSourcesChartProps {
  data: TrafficSource[];
  height?: number;
}

const TrafficSourcesChart: React.FC<TrafficSourcesChartProps> = ({ data, height = 350 }) => {
  // Filter out sources with 0 visitors to avoid empty pie slices
  const filteredData = data.filter(item => item.visitors > 0);
  
  // If no data, show placeholder
  if (filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
        <div className="flex items-center justify-center" style={{ height: height - 50 }}>
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-500">No traffic data available</p>
          </div>
        </div>
      </div>
    );
  }
  
  const chartData = [{
    type: 'pie' as const,
    labels: filteredData.map(item => item.source),
    values: filteredData.map(item => item.visitors),
    textinfo: 'label+percent',
    textposition: 'auto',
    hole: 0.4, // Creates a donut chart
    marker: {
      colors: [
        '#3B82F6', // Blue for Direct
        '#EF4444', // Red for Google
        '#10B981', // Green for Social Media
        '#F59E0B', // Yellow for Referral
        '#8B5CF6'  // Purple for Email
      ]
    },
    hovertemplate: '<b>%{label}</b><br>Visitors: %{value}<br>Percentage: %{percent}<extra></extra>',
    textfont: {
      size: 12,
      color: '#374151'
    }
  }];

  const layout = {
    showlegend: true,
    legend: {
      orientation: 'v' as const,
      x: 1.05,
      y: 0.5,
      font: { size: 12, color: '#374151' }
    },
    margin: { l: 20, r: 120, t: 20, b: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
      <InteractiveChart
        data={chartData}
        height={height}
        layout={layout}
        showControls={false}
        className="w-full"
      />
    </div>
  );
};

export default TrafficSourcesChart; 