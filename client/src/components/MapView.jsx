import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function MapView({ selectedZone, setSelectedZone, predictionData, setUserLocation, selectedTime }) {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // this is centering the map on NYC
    const projection = d3.geoMercator()
      .center([-73.9851, 40.7589])
      .scale(60000)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);
    const g = svg.append('g');

    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('padding', '6px 10px')
      .style('background', 'white')
      .style('color', '#1f2937')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 6px rgba(0,0,0,0.15)')
      .style('visibility', 'hidden');

    // loading GeoJSON data for NYC taxi zones

    d3.json('/data/taxi_zones.geojson').then(geoData => {
      const allDemands = Object.values(predictionData || {}).map(d => d.demand);
      const maxDemand = d3.max(allDemands) || 1;

      const colorScale = d3.scaleLinear()
        .domain([0, maxDemand * 0.5, maxDemand])
        .range(['#fee5d9', '#fcae91', '#de2d26']);

      g.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', pathGenerator)
        .attr('fill', d => {
          const zoneId = d.properties.location_id;
          const demand = predictionData?.[zoneId]?.demand;
          return demand !== undefined ? colorScale(demand) : '#f3f4f6'; // light gray if unknown
        })
        .attr('stroke', '#333')
        .attr('stroke-width', d => d.properties.location_id === selectedZone ? 2 : 0.5)
        .style('filter', d => d.properties.location_id === selectedZone
          ? 'drop-shadow(0 0 4px rgba(190, 18, 60, 0.6))'
          : null)
        .attr('opacity', 0.6)
        .on('mouseover', function (event, d) {
          const zoneId = d.properties.location_id;
          const info = predictionData?.[zoneId];
          tooltip
            .style('visibility', 'visible')
            .html(
              `<strong>${info?.zoneName || 'Zone ' + zoneId}</strong><br/>
               Demand: ${info?.demand !== undefined ? Math.round(info.demand) : 'N/A'}<br/>
               Borough: ${info?.borough ?? 'Unknown'}`
            );
          d3.select(this).attr('opacity', 1);
        })
        .on('mousemove', function (event) {
          tooltip
            .style('top', event.pageY + 10 + 'px')
            .style('left', event.pageX + 15 + 'px');
        })
        .on('mouseout', function () {
          tooltip.style('visibility', 'hidden');
          d3.select(this).attr('opacity', 0.6);
        })
        .on('click', (event, d) => setSelectedZone(d.properties.location_id));

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });

          const [x, y] = projection([longitude, latitude]);
          g.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 6)
            .attr('fill', 'blue');
        });
      }
    });

    const zoom = d3.zoom()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
  }, [predictionData]);

  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full bg-yellow-100" />
      <div ref={tooltipRef} />

      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow text-xs text-gray-700 z-50">
        <div className="mb-1 font-semibold">Demand Intensity</div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-3 rounded" style={{ background: '#fee5d9' }} />
          <span>Low</span>
          <div className="w-4 h-3 rounded" style={{ background: '#fcae91' }} />
          <div className="w-4 h-3 rounded" style={{ background: '#de2d26' }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
