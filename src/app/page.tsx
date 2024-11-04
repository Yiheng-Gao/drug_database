'use client'

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DateCount {
  date: string; // Original date string from BigQuery
  count: number;
}

export default function Home() {
  const d3Container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Capture the current value of the ref
    const container = d3Container.current;

    // If the container is not available, exit early
    if (!container) {
      console.error('D3 container is not available.');
      return;
    }

    // Define an async function to fetch and render data
    const fetchDataAndRender = async () => {
      try {
        const response = await fetch('https://get-date-count-jotf3wno6q-uc.a.run.app');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: DateCount[] = await response.json();

        if (!data || data.length === 0) {
          console.error('No data received from the Cloud Function.');
          return;
        }

        // Ensure data is sorted by date
        data.sort((a: DateCount, b: DateCount) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Set up dimensions and margins
        const margin = { top: 20, right: 30, bottom: 50, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Parse the date / time
        const parseDate = d3.timeParse('%Y-%m-%d'); // Adjust format based on your date format

        // Format the data
        const formattedData = data.map((d) => ({
          date: parseDate(d.date) as Date, // Assert that parseDate returns a Date
          count: d.count,
        })).filter(d => d.date !== null); // Filter out any entries where date parsing failed

        if (formattedData.length === 0) {
          console.error('No valid date entries after parsing.');
          return;
        }

        // Remove any existing SVG to prevent duplicates
        d3.select(container).select('svg').remove();

        // Set up scales
        const xDomain = d3.extent(formattedData, (d) => d.date);
        if (!xDomain[0] || !xDomain[1]) {
          throw new Error('No data available for the X axis.');
        }

        const x = d3.scaleTime()
          .domain(xDomain as [Date, Date]) // Type assertion
          .range([0, width]);

        const yMax = d3.max(formattedData, (d) => d.count);
        if (yMax === undefined) {
          throw new Error('No data available for the Y axis.');
        }

        const y = d3.scaleLinear()
          .domain([0, yMax])
          .range([height, 0]);

        // Append SVG element
        const svg = d3.select(container)
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add X axis
        svg.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(6))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');

        // Add Y axis
        svg.append('g')
          .call(d3.axisLeft(y));

        // Add the line
        svg.append('path')
          .datum(formattedData)
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 1.5)
          .attr('d', d3.line<{ date: Date; count: number }>()
            .x((d) => x(d.date))
            .y((d) => y(d.count))
          );

        // Add points (optional)
        svg.selectAll('dot')
          .data(formattedData)
          .enter()
          .append('circle')
          .attr('cx', (d) => x(d.date))
          .attr('cy', (d) => y(d.count))
          .attr('r', 3)
          .attr('fill', 'steelblue');

      } catch (error) {
        console.error('Error fetching or rendering data:', error);
      }
    };

    fetchDataAndRender();

    // Cleanup function to remove SVG on unmount
    return () => {
      if (container) {
        d3.select(container).select('svg').remove();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div>
      <h1>Date Counts Line Graph</h1>
      <div ref={d3Container}></div>
    </div>
  );
}
