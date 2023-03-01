import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useRef, useState, useInterval, Component } from 'react';
import { Slider, Button } from '@mui/material';

const inter = Inter({ subsets: ['latin'] })

const Response = () => {

  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 50, left: 60, bottom: 60, right: 60}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }

  //average age of injury (x-axis) => estimated counts (radius..?) => separated by theme
  
  const dims = chartDimensions();

  useEffect(() => {
    d3.csv('http://localhost:3000/body_parts.csv')
      .then((data) => {
        console.log(data);
        setDataset(data);
        setFiltered(data);
      })
      .catch((err) => {
        console.log(err)
        console.log("csv error");
        return null;
    });
  }, []);


  const ref = useRef()


  return (
    <div style={{width:'90%',}}>
      <svg
        viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
        ref={ref}
      >
        
      </svg>
      
    </div>
  );
}

const AgeBars = () => {

  const [ageRange, setAgeRange] = useState([0, 100]);

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 50, left: 60, bottom: 60, right: 60}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  
  const dims = chartDimensions();


  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);

  useEffect(() => {
    d3.csv('http://localhost:3000/body_parts.csv')
      .then((data) => {
        console.log(data);
        setDataset(data);
        setFiltered(data);
      })
      .catch((err) => {
        console.log(err)
        console.log("csv error");
        return null;
    });
  }, []);



  useEffect(() => {
    console.log("this is the data");
    console.log(dataset);
  }, [dataset])

  const handleChange = (event, newValue) => {
    if (newValue[0] !== ageRange[0] || newValue[1] !== ageRange[1]) {
      setAgeRange(newValue);
    }
  };
  
  useEffect(() => {
    if (dataset) {
      setFiltered(dataset.filter(function (d) {
        return (d.Age >= ageRange[0] && d.Age <= ageRange[1])
      }));
      console.log(filtered);
    }
    console.log("changed agerange");
    console.log(ageRange);
  }, [ageRange]);

  useEffect(() => {
    console.log("filter changed");
    if (filtered) {


      const dim = chartDimensions();
      console.log(dim);
      
      const svgElement = d3.select(ref.current);
      let dataRoll = d3.rollups(filtered, v => d3.sum(v, d => d.Weight),
        d => d.Body_Part, d => { 
          if (d.Sex == 0) {
            return "UNKNOWN";
          }
          if (d.Sex == 1) {
            return "MALE";
          }
          if (d.Sex == 2) {
            return "FEMALE";
          }
          if (d.Sex == 3) {
            return "NON-BINARY/OTHER";
          }} 
        ).map(([body_part, sex]) => {
        return {body_part: body_part, sex: sex, count: d3.sum(sex, d => d[1])}
      }).sort(function(a, b) {
        return d3.descending(d3.sum(a.sex, d => d[1]), d3.sum(b.sex, d => d[1]));
      });

      console.log(dataRoll);
      dataRoll = dataRoll.slice(0,10);
      console.log(dataRoll);



      var xScale = d3.scaleBand()
        .domain(dataRoll.map(d => d.body_part))
        .range([0, dim.width])
        .padding(0.1);
      
      var yScale = d3.scaleLinear()
        .domain([0,d3.max(dataRoll, d => d.count)])
        .range([dim.height , 0]);
      
      //x scale axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale));
      //y scale axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale));
      
      console.log(dataRoll);
      
      const info = svgElement.select("#rectGroup").selectAll("rect")
      .data(dataRoll, function(d) { return d.body_part; })
      .join(enter => enter.append("rect")
        .attr("x", d => xScale(d.body_part))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => dim.height - yScale(d.count))
        .attr("fill", "black")
        .attr("opacity", 0.75),
      update => update,
      exit => exit
        .transition()
        .duration(1000)
        .attr("y", yScale(0))
        .attr("height", 0)
        .attr("opacity", 0)
        .remove()
      );
      info.transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("x", d => xScale(d.body_part))
      .attr("y", d => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", d => dim.height - yScale(d.count))
      .attr("fill", "black")
      .attr("opacity", 0.75);
    }
  }, [filtered]);


  const ref = useRef()


  return (
    <div style={{width:'90%',}}>
      <svg
        viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
        ref={ref}
      >
        <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
      </svg>
      <Slider
        getAriaLabel={() => 'Age range'}
        value={ageRange}
        onChange={handleChange}
        valueLabelDisplay="auto"
        step={1}
      />
      <p>Top 10 Estimated Body Parts Injured -- defined by Age Range</p>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
  
  }, []);


  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <AgeBars />
        <Response />
      </main>
      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        #circle {
          display: inline-block;
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          vertical-align: top;
          overflow: hidden;
      }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  )
}
