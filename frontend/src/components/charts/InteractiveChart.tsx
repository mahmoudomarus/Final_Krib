import React from 'react';
// @ts-ignore - Ignoring TypeScript errors for react-plotly.js
import Plot from 'react-plotly.js';

interface InteractiveChartProps {
  data: any[];
  title?: string;
  layout?: any;
  config?: any;
  height?: number;
  width?: number;
  className?: string;
  showControls?: boolean;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  layout = {},
  config = {},
  height = 400,
  width,
  className = '',
  showControls = false
}) => {
  const defaultConfig = {
    displayModeBar: showControls,
    displaylogo: false,
    modeBarButtonsToRemove: showControls ? ['pan2d', 'lasso2d', 'select2d', 'autoScale2d', 'resetScale2d'] : [],
    responsive: true,
    staticPlot: !showControls,
    ...config
  };

  const defaultLayout = {
    autosize: true,
    height,
    width,
    margin: { t: title ? 50 : 20, r: 20, b: 20, l: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 12,
      color: '#374151'
    },
    ...(title && {
      title: {
        text: title,
        font: { 
          size: 16, 
          color: '#374151',
          family: 'Inter, system-ui, sans-serif'
        },
        x: 0.05,
        xanchor: 'left'
      }
    }),
    ...layout
  };

  return (
    <div className={`w-full ${className}`} style={{ minHeight: height }}>
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default InteractiveChart; 