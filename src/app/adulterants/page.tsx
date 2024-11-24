/* eslint-disable */
'use client'

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './page.css';

interface SubstanceCount {
  substance: string;
  count: number;
}

export default function Adulterants() {
  const [data, setData] = useState<SubstanceCount[]>([]);
  const d3Container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://get-substance-num-jotf3wno6q-uc.a.run.app');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const fetchedData: SubstanceCount[] = await response.json();

        // Process the data
        const sortedData = fetchedData.sort((a, b) => b.count - a.count);

        // Get the top 10 substances
        const top10 = sortedData.slice(0, 10);

        // Sum the counts of the remaining substances
        const otherCount = sortedData.slice(10).reduce((sum, item) => sum + item.count, 0);

        // Add the "Other" category
        if (otherCount > 0) {
          top10.push({ substance: 'Other', count: otherCount });
        }

        setData(top10);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
  
    const container = d3Container.current;
    if (!container) {
      console.error('D3 container is not available.');
      return;
    }
  
    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();
  
    // Set dimensions and margins
    const width = 800;
    const height = 800;
    const margin = 200;
  
    const radius = Math.min(width, height) / 2 - margin;
  
    // Append the svg object to the container div
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
    // Set the color scale
    const color = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => d.substance))
      .range(d3.schemeCategory10);
  
    // Compute the position of each group on the pie
    const pie = d3.pie<SubstanceCount>().value((d) => d.count);
    const data_ready = pie(data);
  
    // Build the pie chart
    const arcGenerator = d3
      .arc<d3.PieArcDatum<SubstanceCount>>()
      .innerRadius(0)
      .outerRadius(radius);
  
    svg
      .selectAll('slices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', (d) => color(d.data.substance))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.7);
  
    // Define arcs for polylines and labels
    const outerArc = d3
      .arc<d3.PieArcDatum<SubstanceCount>>()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);
  
    // Prepare the positions of labels
    const labelPositions: { x: number; y: number; data: d3.PieArcDatum<SubstanceCount> }[] = data_ready.map((d) => {
      const pos = outerArc.centroid(d);
      const midAngle = (d.startAngle + d.endAngle) / 2;
      pos[0] = radius * 1.3 * (midAngle < Math.PI ? 1 : -1); // Adjust horizontal position
      return { x: pos[0], y: pos[1], data: d };
    });
  
    // Sort labels to detect overlaps
    labelPositions.sort((a, b) => a.y - b.y);
  
    // Adjust labels to prevent overlaps
    const spacing = 14; // Minimum spacing between labels
    for (let i = 1; i < labelPositions.length; i++) {
      const prev = labelPositions[i - 1];
      const curr = labelPositions[i];
      if (curr.y - prev.y < spacing) {
        curr.y = prev.y + spacing;
      }
    }
  
    // Add polylines (leader lines)
    svg
      .selectAll('allPolylines')
      .data(labelPositions)
      .enter()
      .append('polyline')
      .attr('stroke', 'black')
      .style('fill', 'none')
      .attr('stroke-width', 1)
      .attr('points', function (d) {
        const posA = arcGenerator.centroid(d.data); // Center of the slice
        const posB = outerArc.centroid(d.data); // Just outside the slice
        const posC = [d.x, d.y]; // Position of the label
        // Convert the array of points into a string
        return [posA, posB, posC]
          .map((point) => point.join(','))
          .join(' ');
      });
  
    // Add labels
    svg
      .selectAll('allLabels')
      .data(labelPositions)
      .enter()
      .append('text')
      .text((d) => d.data.data.substance)
      .attr('transform', function (d) {
        return `translate(${d.x},${d.y})`;
      })
      .style('text-anchor', function (d) {
        const midAngle = (d.data.startAngle + d.data.endAngle) / 2;
        return midAngle < Math.PI ? 'start' : 'end';
      })
      .style('font-size', 12);
  }, [data]);
  


  return (
    <div>
      <div id="header">
        <b>Propotion of Adulterants</b>
      </div>
      
      <div id="pie-chart-container" ref={d3Container}></div>
    </div>
  );
}
