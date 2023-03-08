import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useRef, useState, useInterval, Component } from 'react';
import { Slider, Button, Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';


const inter = Inter({ subsets: ['latin'] })



const Products = () => {

  var productTypes = [ "ALL", "HOUSEHOLD APPLIANCES",  "HOME FIXTURES",  "HOME EQUIPMENT AND CONTAINERS",  "SPORTS AND RECREATIONAL ACTIVITY",  "TOYS",  "INDUSTRIAL, MEDICAL, AND CHILD-CARE EQUIPMENT",  "PERSONAL CARE ITEMS",  "OTHER"];
  var productTypes2 = [ "HOUSEHOLD APPLIANCES",  "HOME FIXTURES",  "HOME EQUIPMENT AND CONTAINERS",  "SPORTS AND RECREATIONAL ACTIVITY",  "TOYS",  "INDUSTRIAL, MEDICAL, AND CHILD-CARE EQUIPMENT",  "PERSONAL CARE ITEMS",  "OTHER"];

  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);
  const [productRange, setProductRange] = useState(["ALL"]);
  const [topN, setTopN] = useState(10);

  const myColor = d3.scaleOrdinal().domain(productTypes2)
      .range(d3.schemeSet3);

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 10, left: 100, bottom: 90, right: 50}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  
  const handleChange = (event, newValue) => {
    if (newValue !== topN) {
      setTopN(newValue);
    }
  };

  const handleChange2 = (event) => {
    console.log(event.target.value);
    setProductRange(event.target.value);
  };

  //average age of injury (x-axis) => estimated counts (radius..?) => separated by theme
  
  const dims = chartDimensions();

  useEffect(() => {
    d3.csv('http://localhost:3000/products111.csv')
      .then((data) => {
        console.log(data);
        setDataset(data);
        let filt = data.filter(function (d) {
          if (productRange.includes("ALL") || productRange == []) {
            return true;
          }
          else {
            return productRange.includes(d.Category);
          }
        });
        
        setFiltered(filt);
      })
      .catch((err) => {
        console.log(err)
        console.log("csv error");
        return null;
    });
  }, []);

  useEffect(() => {
    if (dataset) {
      setFiltered(dataset.filter(function (d) {
        if (productRange.includes("ALL") || productRange == []) {
          return true;
        }
        else {
          return productRange.includes(d.Category);
        }
      }));
      console.log(filtered);
    }
    console.log("changed productrange");
    console.log(productRange);
  }, [productRange]);

  useEffect(() => {
    console.log("filter changed");
    if (filtered) {
      
      const dim = chartDimensions();
      console.log(dim);
      
      const svgElement = d3.select(ref.current);

      let dataRoll = d3.rollups(filtered, v => d3.sum(v, d => d.Weight),
      d => d.Product_Name, d => d.Category);
      console.log("penis");
      console.log(dataRoll);
      dataRoll = dataRoll.map(([product_name, cat]) => {
      return {product_name: product_name, count: cat[0][1], category: cat[0][0]}
    }).sort(function(a, b) {
      return d3.descending(+a.count, +b.count);
    });


      console.log(dataRoll);
      dataRoll = dataRoll.slice(0,topN);
      console.log(dataRoll);

      var xScale = d3.scaleBand()
        .domain(dataRoll.map(d => d.product_name))
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
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", `translate(${0})rotate(-20)`)
      .style("text-anchor", "end")
      .style("font-size", "5")




      //y scale axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale));

      var tooltipGroup = svgElement.select("#tooltipGroup")
      .style("display", "none") // hidden by default
      .select("#tooltip-text")
        .style("white-space", "normal")
        .attr("font-size", "7px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .style("text-anchor", "start");
      var tool = svgElement.select("#tooltipGroup").select("#tooltip-text2")
        .style("white-space", "normal")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .style("text-anchor", "start");
      
      console.log(dataRoll);

      //old way of doing this i honestly think this is lowkey better
      const info = svgElement.select("#rectGroup").selectAll("rect")
      .data(dataRoll, function(d) { return d.product_name; })
      .join(enter => enter.append("rect")
        .attr("x", d => xScale(d.product_name))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => dim.height - yScale(d.count))
        .attr("fill", d => myColor(d.category))
        .attr("opacity", 0.75)
        .on("mouseover", function (event, d) {  // <-- need to use the regular function definition to have access to "this"
          /**
          svgElement.select("#tooltip-text")
            .text(`${d.product_name}`);
          */
          svgElement.select("#tooltip-text2")
            .text(`${Math.round(d.count)}`);
          svgElement.select("#tooltipGroup")
            // move the tooltip to where the cursor is 
            .style("display", "block")
            .select("#tooltip-text")
            .attr("x", d3.select(this).attr("x"))
            .attr("y", d3.select(this).attr("y"));
          svgElement.select("#tooltipGroup")
            .select("#tooltip-text2")
              .attr("x", d3.select(this).attr("x"))
              .attr("y", d3.select("#tooltip-text").attr("y"));  // make tooltip visible
          d3.select(this)
            .attr("stroke", "#333333")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function (event, d) {
          svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
          d3.select(this).attr("stroke", "none");  // undo the stroke
        }),
      update => update,
      exit => exit
        .transition()
        .duration(1000)
        .attr("y", dim.height)
        .attr("height", 0)
        .attr("opacity", 0)
        .remove()
      );
    
      info.transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("x", d => xScale(d.product_name))
      .attr("y", d => yScale(d.count))
      .attr("width", xScale.bandwidth())
      .attr("height", d => dim.height - yScale(d.count))
      .attr("fill", d => myColor(d.category))
      .attr("opacity", 0.75);
      /**
      tooltipGroup = svgElement.select("#tooltipGroup")
      .style("display", "none") // hidden by default
      .append("text")
        .attr("id", "tooltip-text")
        .attr("x", 5)
        .attr("y", 15)
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "black");
        */

    }
  }, [filtered, topN]);

  const ref = useRef();


  return (
    <div style={{width:'90%',}}>
      <svg
        viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
        ref={ref}
      >
        <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="tooltipGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}><text id="tooltip-text"></text><text id="tooltip-text2"></text></g>
        
      </svg>
      <div></div>
      <div style={{width:'50%',}}>
      <Slider
        getAriaLabel={() => 'Show Top:'}
        value={topN}
        onChange={handleChange}
        min={1}
        max={15}
        valueLabelDisplay="auto"
        step={1}
      />
      </div>
      <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Product Category</InputLabel>
        <Select
          multiple
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={productRange}
          label="Product Category"
          onChange={handleChange2}
        >
          {productTypes.map((value, index) => {
            return (<MenuItem key = {index} value = {value}>{value}</MenuItem>);
          })}
        </Select>
      </FormControl>
    </Box>
    </div>
  );
}

const AgeBars = () => {

  const [ageRange, setAgeRange] = useState([1, 120]);

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
      /**
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
        );
      console.log(dataRoll);
      dataRoll = dataRoll.map(([body_part, sex]) => {
        let u, m, f, n = 0;
        sex.forEach(s => {
          if (s[0] == "UNKNOWN") {
            u = s[1]
          }
          else if (s[0] == "MALE") {
            m = s[1]
          }
          else if (s[0] == "FEMALE") {
            f = s[1]
          }
          else if (s[0] == "NON-BINARY/OTHER") {
            n = s[1]
          }
        });
        return {body_part: body_part, "UNKNOWN": u, "MALE": m, "FEMALE": f, "NON-BINARY/OTHER": n, totalcount: d3.sum(sex, d => d[1])}
      }).sort(function(a, b) {
        return d3.descending(a.totalcount, b.totalcount);
      });
      */
      let dataRoll = d3.rollups(filtered, v => d3.sum(v, d => d.Weight),
      d => d.Body_Part);
      dataRoll = dataRoll.map(([body_part, count]) => {
      if (body_part === "25") {
        body_part = "25-50% OF BODY";
      }
      return {body_part: body_part, count: count}
    }).sort(function(a, b) {
      return d3.descending(+a.count, +b.count);
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

      /**
      const stacked = d3.stack().keys(["UNKNOWN","MALE","FEMALE","NON-BINARY/OTHER"])(dataRoll);
      console.log(stacked);
      */
      //old way of doing this i honestly think this is lowkey better
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
        .attr("y", dim.height)
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

      /**
      const info = svgElement.select("#rectGroup").selectAll("g")
      .data(stacked, function(d) { return d.body_part; })
      .join(enter => enter.append("g")
        .style("fill", d => colors[d.key]),
      update => update,
      exit => exit.transition()
      .duration(300)
      .attr("height", 0)
      .attr("opacity", 0)
      .remove()
      );

      const rectgroup = info.selectAll("rect")
      .data((d) => d)
      .join(enter => enter.append("rect")
        .attr("x", d => xScale(d.data.body_part))
        .attr("y", d => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", d => {return yScale(d[0]) - yScale(d[1]);})
        .attr("opacity", 0.75),
        update => update,
        exit => exit.transition()
        .duration(300)
        .attr("y", yScale(0))
        .attr("height", 0)
        .attr("opacity", 0)
        .remove()
      );

      rectgroup.transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("x", d => xScale(d.data.body_part))
      .attr("y", d => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => {return yScale(d[0]) - yScale(d[1]);})
      .attr("opacity", 0.75);
      */
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
        min={1}
        max={120}
        valueLabelDisplay="auto"
        step={1}
      />
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
        <h1>Consumer Product-Related Injury Estimates Across the U.S</h1>
        <p> Where are people getting injured? </p>
        <AgeBars />
        <Products />
      </main>
      <style jsx>{`
        main {
          padding: 0rem 0;
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
        text {
          white-space: normal;
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
