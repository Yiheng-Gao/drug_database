/* eslint-disable */
'use client'

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sliderBottom } from 'd3-simple-slider'; // Import the slider module
import './page.css';
import { Button, Form, Input, Select, Space } from 'antd';

interface DateCount {
  date: string; // Original date string from BigQuery
  count: number;
}

const { Option } = Select;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

export default function Home() {
  const d3Container = useRef<HTMLDivElement | null>(null);
  const sliderContainer = useRef<HTMLDivElement | null>(null);
  const [form] = Form.useForm();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [data, setData]=useState<DateCount[]>([]);

  const onFinish = (values: any)=>{
    const category = values.Category;
    if(category){
      setSelectedCategory(category);
    }
  }

  // const onCategoryChange = (value: string) => {
  //   switch (value) {
  //     case 'Opioid':
  //       break;
  //     case 'Stimulant':
  //       break;
  //     default:
  //   }
  // };

  useEffect(() => {

    
    // Capture the current value of the ref
    const container = d3Container.current;
    const sliderDiv = sliderContainer.current;

    // If the container is not available, exit early
    if (!container || !sliderDiv) {
      console.error('D3 container or slider container is not available.');
      return;
    }

    // Define an async function to fetch and render data
    const fetchData = async (category: string | null) => {
      try {
        // Fetch data from the provided URL
        let url = 'https://get-date-count-jotf3wno6q-uc.a.run.app'
        if(category&&category!='All'){
          url=`https://get-category-count-jotf3wno6q-uc.a.run.app/?category=${encodeURIComponent(category)}`;
        }else{
          let url = 'https://get-date-count-jotf3wno6q-uc.a.run.app'
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const fetchedData: DateCount[] = await response.json();

        if (!fetchedData || fetchedData.length === 0) {
          console.error('No data received from the Cloud Function.');
          return;
        }
        setData(fetchedData);
      }
      catch (error) {
        console.error('Error fetching or rendering data:', error);
      }
    };

    if(selectedCategory!==null){
      fetchData(selectedCategory);
    }else{
      fetchData(null);
    }
  },[selectedCategory]);

  useEffect(()=>{
    if(!data||data.length===0) return;

        // Capture the current value of the ref
        const container = d3Container.current;
        const sliderDiv = sliderContainer.current;
    
        // If the container is not available, exit early
        if (!container || !sliderDiv) {
          console.error('D3 container or slider container is not available.');
          return;
        }
            // Remove any existing SVG to prevent duplicates
        d3.select(container).selectAll('svg').remove();
        d3.select(sliderDiv).selectAll('svg').remove();
        d3.select('body').selectAll('.tooltip').remove();
        // Set up dimensions and margins
        const margin = { top: 70, right: 60, bottom: 100, left: 80 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

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
          .attr('class', 'x-axis')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(6))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end')
          .style('font-size', '14px')
          .style('fill', '#777');

        // Add Y axis
        svg.append('g')
          .attr('class', 'y-axis')
          .attr('transform', `translate(${width},0)`)
          .call(d3.axisLeft(y).ticks(10).tickFormat(d => `$${d}`))
          .selectAll('text')
          .style('font-size', '14px')
          .style('fill', '#777');

        // Set up the line generator
        const line = d3.line<{ date: Date; count: number }>()
          .x((d) => x(d.date))
          .y((d) => y(d.count));

        // Add the line path
        svg.append('path')
          .datum(formattedData)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-width', 1.5)
          .attr('d', line);

        // Create tooltip divs
        const tooltipX = d3.select("body")
          .append("div")
          .attr("class", "tooltip tooltip-x")
          .style("position", "absolute")
          .style("background", "#fff")
          .style("padding", "5px")
          .style("border", "1px solid #ccc")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        const tooltipY = d3.select("body")
          .append("div")
          .attr("class", "tooltip tooltip-y")
          .style("position", "absolute")
          .style("background", "#fff")
          .style("padding", "5px")
          .style("border", "1px solid #ccc")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        // Add overlay for capturing mouse movements
        svg.append("rect")
          .attr("width", width)
          .attr("height", height)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", mousemove)
          .on("mouseout", mouseout);

        // Define the lines for tooltips
        const tooltipLineX = svg.append("line")
          .attr("class", "tooltip-line tooltip-line-x")
          .attr("stroke", "red")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
          .style("opacity", 0);

        const tooltipLineY = svg.append("line")
          .attr("class", "tooltip-line tooltip-line-y")
          .attr("stroke", "red")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
          .style("opacity", 0);

        // Function to handle mouse movements
        function mousemove(event: any) {
          const mouse = d3.pointer(event);
          const mouseDate = x.invert(mouse[0]);
          const bisect = d3.bisector((d: any) => d.date).left;
          const idx = bisect(formattedData, mouseDate);
          const selectedData = formattedData[idx - 1] || formattedData[0];

          // Update tooltip positions and content
          tooltipX
            .style("left", (event.pageX) + "px")
            .style("top", (height+100) + "px")
            .html(`Date: ${d3.timeFormat("%Y-%m-%d")(selectedData.date)}`)
            .transition()
            .duration(50)
            .style("opacity", 1);

          tooltipY
            .style("left", (width+40) + "px")
            .style("top", (event.pageY) + "px")
            .html(`Count: ${selectedData.count}`)
            .transition()
            .duration(50)
            .style("opacity", 1);

          // Update tooltip lines
          tooltipLineX
            .attr("x1", x(selectedData.date))
            .attr("x2", x(selectedData.date))
            .attr("y1", 0)
            .attr("y2", height)
            .transition()
            .duration(200)
            .style("opacity", 1);

          tooltipLineY
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(selectedData.count))
            .attr("y2", y(selectedData.count))
            .transition()
            .duration(200)
            .style("opacity", 1);
        }

        // Function to handle mouse out
        function mouseout() {
          tooltipX.transition()
            .duration(500)
            .style("opacity", 0);

          tooltipY.transition()
            .duration(500)
            .style("opacity", 0);

          tooltipLineX.transition()
            .duration(500)
            .style("opacity", 0);

          tooltipLineY.transition()
            .duration(500)
            .style("opacity", 0);
        }

          
     

        // Define the slider
        const slider = sliderBottom<Date>()
          .min(d3.min(formattedData, d => d.date) as Date)
          .max(d3.max(formattedData, d => d.date) as Date)
          .width(400)
          .tickFormat(d3.timeFormat('%Y'))
          .ticks(5)
          .default([d3.min(formattedData, d => d.date) as Date, d3.max(formattedData, d => d.date) as Date])
          .fill('#85bb65');


        slider.on('onchange', (val: [Date, Date]) => {
            console.log('Slider value:', val); // Log the slider values to verify
            // Update the x scale domain based on slider values
            x.domain(val);
          
            // Filter data based on slider range
            const filteredData = formattedData.filter(d => d.date >= val[0] && d.date <= val[1]);
        
          
            // Update the y scale domain based on filtered data
            const newYMax = filteredData.length > 0 ? d3.max(filteredData, d => d.count) : 0;
            y.domain([0, newYMax||yMax]);

            // Update the line path
            svg.select('.line')
              .datum(filteredData)
              .attr('d', line)
              .attr('stroke', 'steelblue');
          
            // Update the Y axis
            svg.select('.y-axis')
              .transition()
              .duration(500)
              .call(d3.axisLeft(y).ticks(10).tickFormat(d => `$${d}`) as any)
              .selectAll('text')
              .style("font-size", "14px")
              .style("fill", "#777");


            // Update the X axis
          svg.select('.x-axis')
            .transition()
            .duration(500)
            .call(d3.axisBottom(x).ticks(6) as any)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '14px')
            .style('fill', '#777');
          });

            
          

        const sliderSvg = d3.select(sliderDiv)
          .append('svg')
          .attr('width', 500)
          .attr('height', 100);
        // Append the slider to the DOM
        const sliderGroup = sliderSvg.append('g')
          .attr('transform', 'translate(30,30)');

        sliderGroup.call(slider as any);

        // Add chart title
        svg.append("text")
          .attr("class", "chart-title")
          .attr("x", width / 2)
          .attr("y", -40)
          .style("text-anchor", "middle")
          .style("font-size", "24px")
          .style("font-weight", "bold")
          .text("Number of Tests Per Day");

      
  }, [data]); 

  return (
    <div id="main-container">
      <div ref={d3Container} id="chart-container"></div>
      <div id="right-container">
        <div id="form-container">
          <Form
            {...layout}
            form={form}
            name="control-hooks"
            style={{ maxWidth: 400 }}
            onFinish={onFinish}
          >
            <Form.Item name="Category" label="Category" rules={[{ required: true }]}>
              <Select
                placeholder="Select an option"
                allowClear
              >
                <Option value="Opioid">Opioid</Option>
                <Option value="Stimulant">Stimulant</Option>
                <Option value="All">All Category</Option>
              </Select>
            </Form.Item>
            <Form.Item {...tailLayout}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
        <div id="slider-container" ref={sliderContainer}></div>
      </div>
    </div>
  );
}
