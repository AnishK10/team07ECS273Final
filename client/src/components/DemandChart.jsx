import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function DemandChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !Array.isArray(data.timeseries)) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 0 },
          width = 320 - margin.left - margin.right,
          height = 240 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const formatTime = (datetimeStr) => {
      const d = new Date(datetimeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // i have formatted this since the backend requires it.
    const formattedData = data.timeseries.map(d => ({
      ...d,
      label: formatTime(d.datetime)
    }));

    const x = d3.scaleBand()
      .domain(formattedData.map(d => d.label))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(formattedData, d => d.demand)])
      .nice()
      .range([height, 0]);

    const maxDemand = d3.max(formattedData, d => d.demand);
    const allSame = formattedData.every(d => d.demand === maxDemand);


    g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("fill", "#1f2937")             
    .style("font-size", "14px")            
    .style("font-weight", "600");

    g.selectAll('.bar')
      .data(formattedData)
      .enter()
      .append('rect')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.demand))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.demand))
      .attr('fill', d => (allSame ? '#60a5fa' : (d.demand === maxDemand ? '#f97316' : '#60a5fa')))
      .attr('rx', 3);

    g.selectAll('.label')
      .data(formattedData)
      .enter()
      .append('text')
      .text(d => d.demand)
      .attr('x', d => x(d.label) + x.bandwidth() / 2)
      .attr('y', d => y(d.demand) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#374151')
      .style('font-size', '12px')
      .style('font-weight', '500');
  }, [data]);

  return (
    <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Demand Forecast</h3>
      <svg ref={ref} width={320} height={260} />
    </div>
  );  
}
