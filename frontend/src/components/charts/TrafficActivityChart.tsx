import React from 'react';
import InteractiveChart from './InteractiveChart';

interface HourlyTraffic {
  hour: number;
  visitors: number;
  pageViews: number;
}

interface TrafficActivityChartProps {
  data: HourlyTraffic[];
  height?: number;
}

const TrafficActivityChart: React.FC<TrafficActivityChartProps> = ({ data, height = 350 }) => {
  const hours = data.map(item => `${item.hour}:00`);
  
  const chartData = [
    {
      x: hours,
      y: data.map(item => item.visitors),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Visitors',
      line: { color: '#3B82F6', width: 3 },
      marker: { color: '#3B82F6', size: 6 },
      hovertemplate: '<b>%{fullData.name}</b><br>Hour: %{x}<br>Count: %{y}<extra></extra>'
    },
    {
      x: hours,
      y: data.map(item => item.pageViews),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Page Views',
      line: { color: '#10B981', width: 3 },
      marker: { color: '#10B981', size: 6 },
      hovertemplate: '<b>%{fullData.name}</b><br>Hour: %{x}<br>Count: %{y}<extra></extra>'
    }
  ];

  const layout = {
    xaxis: {
      title: {
        text: 'Hour of Day',
        font: { size: 12, color: '#6B7280' }
      },
      showgrid: true,
      gridcolor: '#F3F4F6',
      color: '#6B7280',
      tickfont: { size: 11, color: '#6B7280' }
    },
    yaxis: {
      title: {
        text: 'Count',
        font: { size: 12, color: '#6B7280' }
      },
      showgrid: true,
      gridcolor: '#F3F4F6',
      color: '#6B7280',
      tickfont: { size: 11, color: '#6B7280' }
    },
    legend: {
      orientation: 'h',
      x: 0,
      y: -0.15,
      font: { size: 12, color: '#374151' }
    },
    hovermode: 'x unified',
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 60, r: 20, t: 20, b: 60 }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Website Activity</h3>
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

export default TrafficActivityChart; 