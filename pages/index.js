import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useRef, useState, useInterval, Component } from 'react';
import { Slider, Button, Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { legendColor } from 'd3-svg-legend';
import legend from 'd3-svg-legend';


const inter = Inter({ subsets: ['latin'] })
var yScale3;

const TimeBars = () => {

  const [ageRange, setAgeRange] = useState([1, 120]);

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 500,
      margin: {top: 50, left: 60, bottom: 60, right: 150}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  
  const dims = chartDimensions();


  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);

  useEffect(() => {
    d3.csv('http://localhost:3000/products10years.csv')
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


  useEffect(() => {
    console.log("filter changed");
    if (filtered) {


      const dim = chartDimensions();
      
      const svgElement = d3.select(ref.current);

      var keys = [];
      let dataRoll = d3.rollups(filtered, v => d3.sum(v, d => d.Weight),
      d => d.Year, d => d.Category);
      console.log("initial rollup is");
      console.log(dataRoll);
      dataRoll = dataRoll.map(([year, categories]) => {
        //let obj = {year: year, totalcount: 0};
        let obj = {year: year};
        for (let i = 0; i < 8; i++) {
          if (keys.length < 8) {
            keys.push(categories[i][0]);
          }
          obj[categories[i][0]] = categories[i][1];
          //obj["totalcount"] += categories[i][1];
        }
        return obj;
      }).sort(function(a,b) {
        return d3.ascending(a.year, b.year);
      });


      var xScale = d3.scaleLinear()
        .domain(d3.extent(dataRoll, function(d) {return d.year;}))
        .range([0, dim.width]);
      
      var yScale = d3.scaleLinear()
        .domain([-10000, 16000000])
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
      


      const stacked = d3.stack().keys(keys)(dataRoll);
      console.log("stacked is:");
      console.log(stacked);

      const myColor = d3.scaleOrdinal().domain(keys)
      .range(d3.schemeSet3);

      const info = svgElement.select("#areaGroup")
        .selectAll("mylayers")
        .data(stacked)
        .join(enter => enter
          .append("path")
            .style("fill", function(d) { return myColor(d.key); })
            .attr("d", d3.area()
              .x(function(d, i) { return xScale(d.data.year); })
              .y0(function(d) { return yScale(d[0]); })
              .y1(function(d) { return yScale(d[1]); }))  
          ,
            update => update,
            exit => exit,
        );
        const info2 = svgElement.select("#circleGroup")
        .selectAll("g")
        .data(stacked)
        .join(enter => enter
          .append("g")
          .style("z-index", 5)
          .attr("class", d => d.key)
          .attr("fill", function(d) { return myColor(d.key); })
          .selectAll("circle")
          .data(function (d) { console.log(d); return d; })
          .enter().append("circle")
            .attr("r", 5)
            .attr("stroke", "black")
            .attr("cx", function(d) { return xScale(d.data.year); })
            .attr("cy", d => yScale(d[1]))
            .on("mouseover", function (event, d) {  // <-- need to use the regular function definition to have access to "this"
              svgElement.select("#tooltip-text")
                .text(`${d3.select(this.parentNode).attr("class")}: ${d[1] - d[0]} `)
                .attr("x", 0)
                .attr("y", 0);
              let bbox = svgElement.select("#tooltipGroup")
                .select("text").node().getBoundingClientRect();
              svgElement.select("#backing")
                .attr("x", 0)
                .attr("y", -1 * bbox.height)
                .attr("width", bbox.width)
                .attr("height", bbox.height)
                .style("display", "block")
                .attr("transform", `translate(${dims.margin.left + xScale(d.data.year) + 1}, ${dims.margin.top + yScale(d[1]) - 10})`)
              svgElement.select("#tooltipGroup")
                // move the tooltip to where the cursor is 
                .style("display", "block")
                .attr("transform", `translate(${dims.margin.left + xScale(d.data.year) + 1}, ${dims.margin.top + yScale(d[1]) - 10})`)
              d3.select(this)
                .attr("stroke", "#333333")
                .attr("stroke-width", 3);
            })
            .on("mouseout", function (event, d) {
              svgElement.select("#backing").style("display", "none");
              svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
              d3.select(this).attr("stroke-width", "1");  // undo the stroke
            })
          ,
            update => update,
            exit => exit,
        );


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
        <g id="areaGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="circleGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <rect fill="white" id="backing"></rect>
        <g id="tooltipGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}><text id="tooltip-text" fontSize={10} fontWeight="bold"></text></g>
        
      </svg>
      <div style={{height: '20%'}}></div>
    </div>
  );
}

const ProductsCircles = () => {

  var productTypes = [ "ALL", "HOUSEHOLD APPLIANCES",  "HOME FIXTURES",  "HOME EQUIPMENT AND CONTAINERS",  "SPORTS AND RECREATIONAL ACTIVITY",  "TOYS",  "INDUSTRIAL, MEDICAL, AND CHILD-CARE EQUIPMENT",  "PERSONAL CARE ITEMS",  "OTHER"];
  var productTypes2 = [ "HOUSEHOLD APPLIANCES",  "HOME FIXTURES",  "HOME EQUIPMENT AND CONTAINERS",  "SPORTS AND RECREATIONAL ACTIVITY",  "TOYS",  "INDUSTRIAL, MEDICAL, AND CHILD-CARE EQUIPMENT",  "PERSONAL CARE ITEMS",  "OTHER"];

  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);
  const [productRange, setProductRange] = useState(["ALL"]);

  const myColor = d3.scaleOrdinal().domain(productTypes2)
      .range(d3.schemeSet3);
  
  var colorLegend = legendColor()
      .labelFormat(d3.format(".2f"))
      .title("Product Categories")
      .titleWidth(175)
      .labelWrap(175)
      .scale(myColor);
  

  

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 40, left: 100, bottom: 30, right: 50}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }


  const handleChange2 = (event) => {
    setProductRange(event.target.value);
  };

  //average age of injury (x-axis) => estimated counts (radius..?) => separated by theme
  
  const dims = chartDimensions();

  useEffect(() => {
    d3.csv('http://localhost:3000/products111.csv')
      .then((data) => {
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
    }
  }, [productRange]);

  useEffect(() => {
    console.log("filter changed");
    if (filtered) {
      
      const dim = chartDimensions();
      
      const svgElement = d3.select(ref.current);
      

      let dataRoll = d3.rollups(filtered, v => [d3.sum(v, d => d.Weight), d3.median(v, d => d.Age)],
      d => d.Product_Name, d => d.Category);
      console.log(dataRoll);
      dataRoll = dataRoll.map(([product_name, cat]) => {
      return {product_name: product_name, count: cat[0][1][0], age: cat[0][1][1] , category: cat[0][0]}
      });


      var xScale = d3.scaleLinear()
        .domain([0, d3.max(dataRoll, d => d.age)])
        .range([0, dim.width]);
      
      yScale3 = d3.scaleLinear()
        .domain([1,d3.max(dataRoll, d => d.count)])
        .range([dim.height , 0]);
      
      

      
      //x scale axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale));



      //svgElement.select("#legend").call(colorLegend);

      //y scale axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale3));

      var tooltipGroup = svgElement.select("#tooltipGroup")
      .style("display", "none") // hidden by default
      .append("text")
        .attr("id", "tooltip-text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-size", "4px")
        .attr("font-weight", "bold")
        .attr("fill", "black");

      
      console.log(dataRoll);

      //old way of doing this i honestly think this is lowkey better
      const info = svgElement.select("#rectGroup").selectAll("circle")
      .data(dataRoll)
      .join(enter => enter.append("circle")
        .on("mouseover", function (event, d) {  // <-- need to use the regular function definition to have access to "this"
          svgElement.select("#tooltip-text")
            .text(`${d.product_name}`);
          let bbox = svgElement.select("#tooltipGroup")
            .select("text").node().getBoundingClientRect();
          svgElement.select("#tooltipGroup")
            .select("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
          svgElement.select("#tooltipGroup")
            // move the tooltip to where the cursor is 
            .style("display", "block")
            .attr("transform", `translate(${dims.margin.left + xScale(d.age) + 10}, ${dims.margin.top + yScale3(d.count) - 10})`)
          d3.select(this)
            .attr("stroke", "#333333")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function (event, d) {
          svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
          d3.select(this).attr("stroke", "none");  // undo the stroke
        })
        .transition()
        .duration(1000)
        .ease(d3.easeBounce)
        .attr("cx", d => xScale(d.age))
        .attr("cy", d => yScale3(d.count))
        .attr("r", 5)
        .attr("fill", d => myColor(d.category))
        .attr("opacity", 1)
        .attr("class", "circleClass")
        ,
      update => update,
      exit => exit
        .transition()
        .duration(1000)
        .attr("r", 0)
        .attr("opacity", 0)
        .remove()
      );
    
      d3.selectAll(".circleClass")
        .on("mouseover", function (event, d) {  // <-- need to use the regular function definition to have access to "this"
          svgElement.select("#tooltip-text")
            .text(`${d.product_name}`);
          let bbox = svgElement.select("#tooltipGroup")
            .select("text").svgElement().getBoundingClientRect
          svgElement.select("#backing")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
            .attr("transform", `translate(${dims.margin.left + xScale(d.age) + 3}, ${dims.margin.top + yScale3(d.count) - 10})`);
          svgElement.select("#tooltipGroup")
            // move the tooltip to where the cursor is 
            .style("display", "block")
            .attr("transform", `translate(${dims.margin.left + xScale(d.age) + 3}, ${dims.margin.top + yScale3(d.count) - 10})`)
          d3.select(this)
            .attr("stroke", "#333333")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function (event, d) {
          svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
          d3.select(this).attr("stroke", "none");  // undo the stroke
        });
      
      info.transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("cx", d => xScale(d.age))
      .attr("cy", d => yScale3(d.count))
      .attr("r", 5)
      .attr("fill", d => myColor(d.category))
      .attr("opacity", 1);



    }
  }, [filtered]);

  const ref = useRef();


  return (
    <div style={{width:'100%'}}>
    <div style={{width:'100%',display: 'flex', flexDirection: 'row'}}>
      <div style={{width:'80%',}}>
        <svg
          viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
          ref={ref}
        >
          <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <rect fill="white" id="backing"></rect>
          <g id="tooltipGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}><text id="tooltip-text" fontSize={8}></text></g>
          <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right - 300}, ${dims.margin.top + 75})`}></g>
        </svg>
      </div>
      
      <Box sx={{ width: '20%'}}>
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

    </div>
    
  );
}



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
    }
  }, [productRange]);

  useEffect(() => {
    console.log("filter changed");
    if (filtered) {
      
      const dim = chartDimensions();
      console.log(dim);
      
      const svgElement = d3.select(ref.current);

      let dataRoll = d3.rollups(filtered, v => d3.sum(v, d => d.Weight),
      d => d.Product_Name, d => d.Category);
      dataRoll = dataRoll.map(([product_name, cat]) => {
      return {product_name: product_name, count: cat[0][1], category: cat[0][0]}
    }).sort(function(a, b) {
      return d3.descending(+a.count, +b.count);
    });


      dataRoll = dataRoll.slice(0,topN);

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
        <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right - 100}, ${dims.margin.top + 75})`}></g>
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
      <div  style={{width:'50%',}}>
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

      dataRoll = dataRoll.slice(0,10);



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
      <div style={{height: '20%'}}></div>
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
        <div style={{width: '90%'}}>
        <h1>Analyzing Consumer Product-Related Injuries in the U.S</h1>
        <p>NEISS stores the previous years worth of injury reports, so we can investigate changing trends. Have consumer product injuries changed at all since 2010? First, let’s examine the total estimated injury counts for each year. We can see that despite the continual growth of the U.S population, that the total number of product injuries have largely remained the same. Also notable is the sharp decline </p>
        <TimeBars></TimeBars>
        <p> Where are people getting injured? </p>
        <AgeBars />
        <Products></Products>
        <ProductsCircles />
        </div>
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
