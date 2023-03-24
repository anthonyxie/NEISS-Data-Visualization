import Head from 'next/head'
import Image from 'next/image';
import * as React from 'react';
import * as d3 from 'd3';
import { useEffect, useRef, useState, useInterval, Component } from 'react';
import { Slider, Button, Box, FormControl, InputLabel, MenuItem, Select, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { legendColor } from 'd3-svg-legend';
import legend from 'd3-svg-legend';


var yScale3;
var myColor;


const TimeBars = () => {

  const [ageRange, setAgeRange] = useState([1, 120]);
  const [showPercents, setShowPercents] = useState(false);
  const textRef = useRef(null);
  const rectRef = useRef(null);

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 450,
      margin: {top: 20, left: 100, bottom: 60, right: 250}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  
  const dims = chartDimensions();


  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);

  useEffect(() => {
    d3.csv('/products10years.csv')
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

  const handleChange = (event) => {
    setShowPercents(event.target.checked);
  }



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
        let sum = 0;
        for (let i = 0; i < 8; i++) {
          if (keys.length < 8) {
            keys.push(categories[i][0]);
          }
          obj[categories[i][0]] = categories[i][1];
          sum += categories[i][1];
        }
        if (showPercents) {
          for (let i = 0; i < 8; i++) {
            obj[categories[i][0]] = (obj[categories[i][0]] / sum) * 100 ;
          }
        }
        return obj;
      }).sort(function(a,b) {
        return d3.ascending(a.year, b.year);
      });
      console.log(keys);

      var xScale = d3.scaleLinear()
        .domain(d3.extent(dataRoll, function(d) {return d.year;}))
        .range([0, dim.width]);
      
      var yScale;
      if (!showPercents) {
        yScale = d3.scaleLinear()
        .domain([-10000, 16000000])
        .range([dim.height , 0]);
      }
      else {
        yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([dim.height , 0]);
      }

      
      //x scale axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(200)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

      //y scale axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(200)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale));
      



      const stacked = d3.stack().keys(keys)(dataRoll);
      console.log("stacked is:");
      console.log(stacked);

      myColor = d3.scaleOrdinal().domain(keys)
      .range(d3.schemeSet3);

      var colorLegend = legendColor()
      .labelFormat(d3.format(".2f"))
      .title("Product Categories")
      .titleWidth(175)
      .labelWrap(175)
      .scale(myColor);

      svgElement.select("#legend").call(colorLegend);

      const info = svgElement.select("#areaGroup")
        .selectAll("path")
        .data(stacked)
        .join(enter => enter
          .append("path")
            .style("fill", function(d) { return myColor(d.key); })
            .attr("d", d3.area()
              .x(function(d, i) { return xScale(d.data.year); })
              .y0(function(d) { return yScale(d[0]); })
              .y1(function(d) { return yScale(d[1]); }))  
          ,
          update => update
            .attr("d", d3.area()
            .x(function(d, i) { return xScale(d.data.year); })
            .y0(function(d) { return yScale(d[0]); })
            .y1(function(d) { return yScale(d[1]); })),
          exit => exit.remove(),
        );
    
        if (!showPercents) {
          d3.select("#yAxisLabel").text("Total Estimated Injury Count");
        }
        else {
          d3.select("#yAxisLabel").text("% of Total Estimated Injuries");
        }
      
        d3.select("#circleGroup").selectAll("g").remove();
        const info2 = svgElement.select("#circleGroup")
        .selectAll("g")
        .data(stacked)
        .join(enter => enter
          .append("g")
          .style("z-index", 5)
          .attr("class", d => d.key)
          .attr("fill", function(d) { return myColor(d.key); })
          .selectAll("circle")
          .data(function (d) { return d; })
          .join(enter => enter.append("circle")
            .attr("r", 5)
            .attr("stroke", "black")
            .attr("cx", function(d) { return xScale(d.data.year); })
            .attr("cy", d => yScale(d[1]))
            .on("mouseover", function (event, d) {  // <-- need to use the regular function definition to have access to "this"
              if (!showPercents) {
                svgElement.select("#tooltip-text")
                  .text(`${d3.select(this.parentNode).attr("class")}: ${d[1] - d[0]} `)
                  .attr("x", -50)
                  .attr("y", 0);
              }
              else {
                svgElement.select("#tooltip-text")
                .text(`${d3.select(this.parentNode).attr("class")}: ${Math.round((d[1] - d[0]) * 100) / 100}\% `)
                .attr("x", -50)
                .attr("y", 0);
              }
              const textElement = textRef.current;
              const rectElement = rectRef.current;
              const bbox = textElement.getBBox();
              rectElement.setAttribute('x', bbox.x - 5);
              rectElement.setAttribute('y', bbox.y - 3);
              rectElement.setAttribute('width', bbox.width + 10);
              rectElement.setAttribute('height', bbox.height + 6);
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
            update => update
              .attr("cx", function(d) { return xScale(d.data.year); })
              .attr("cy", d => yScale(d[1])),
            exit => exit.remove()
          ),
            update => update.attr("fill", function(d) { return myColor(d.key); }),
            exit => exit.remove()
        );
      


    }
  }, [filtered, showPercents]);


  const ref = useRef()


  return (
    <div style={{width:'90%',}}>
      <div>
      <FormGroup style={{width:'50%',}}>
        <FormControlLabel control={<Checkbox onChange={handleChange}  checked={showPercents} />} label="Show Percentages" />
      </FormGroup>
      </div>
      <svg
        viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
        ref={ref}
      >
        <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="areaGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="circleGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
        <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right + 50}, ${dims.margin.top + 75})`}></g>
        <text id="yAxisLabel"x={-(dims.margin.top + dims.height / 2)} y={30} transform={`rotate(${-90})`} textAnchor="middle" fontSize={15} >Population</text>
        <text x={dims.svgWidth / 2} y={dims.svgHeight - 20} textAnchor="middle" fontSize={15} >Year</text>
        <g id="tooltipGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}><rect rx="5" fill="white" style={{stroke: 'black'}} ref={rectRef} ></rect><text id="tooltip-text" fontSize={13} fontWeight="bold" ref={textRef} ></text></g>

        
        
      </svg>
      <div style={{height: '20%'}}></div>
    </div>
  );
}

const ProductsCircles = () => {

  var productTypes = ['ALL', 'HOUSEHOLD APPLIANCES', 'HOUSEHOLD FIXTURES', 'HOME EQUIPMENT', 'SPORTS AND RECREATION', 'TOYS', 'ASSORTED EQUIPMENT', 'PERSONAL CARE ITEMS', 'OTHER'];
  var productTypes2 = ['HOUSEHOLD APPLIANCES', 'HOUSEHOLD FIXTURES', 'HOME EQUIPMENT', 'SPORTS AND RECREATION', 'TOYS', 'ASSORTED EQUIPMENT', 'PERSONAL CARE ITEMS', 'OTHER'];
  var yearList = [2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

  const [year, setAge] = useState(2021);

  const handleChange = (event) => {
    setAge(event.target.value);
  };


  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);
  const [filtered2, setFiltered2] = useState(null);
  const [trackedProducts, setTrackedProducts] = useState(["FLOORS OR FLOORING MATERIALS", "STAIRS OR STEPS"]);
  const [productRange, setProductRange] = useState(["ALL"]);
  const textRef = useRef(null);
  const rectRef = useRef(null);
  const textRef2 = useRef(null);

  const myColor2 = d3.scaleOrdinal().domain(productTypes2)
      .range(d3.schemeSet3);
  
  var colorLegend = legendColor()
      .labelFormat(d3.format(".2f"))
      .title("Product Categories")
      .titleWidth(175)
      .labelWrap(175)
      .scale(myColor2);
  

  

  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 40, left: 90, bottom: 60, right: 220}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  const chartDimensions2 = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 40, left: 90, bottom: 60, right: 220}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }


  const handleChange2 = (event) => {
    const selectedValues = event.target.value;
    if (selectedValues.includes('ALL') && selectedValues.length > 1) {
      selectedValues.splice(selectedValues.indexOf('ALL'), 1);
    } else if (selectedValues.length === 0) {
      selectedValues.push('ALL');
    }
    setProductRange(selectedValues);
  };

        
  const handleAdd = (product) => {
    let pList = [...trackedProducts, product]
    console.log(pList);
    setTrackedProducts(pList);
  }

  const handleRemove = (product) => {
    let pList = trackedProducts.filter(a => a !== product);
    if (pList.length > 0) {
      setTrackedProducts(pList);
      return true;
    }
    else {
      return false;
    }
  }


  //average age of injury (x-axis) => estimated counts (radius..?) => separated by theme
  
  const dims = chartDimensions();

  useEffect(() => {
    d3.csv('/products10years.csv')
      .then((data) => {
        setDataset(data);
        let filt = data.filter(function (d) {
          if (productRange.includes("ALL") || productRange == []) {
            return d.Year == year && d.Weight > 10000;
          }
          else {
            return productRange.includes(d.Category) && d.Year == year && d.Weight > 10000;
          }
        });
        
        let filt2 = data.filter(function (d) {
          return trackedProducts.includes(d.Product_Name);
        })
        
        setFiltered(filt);
        setFiltered2(filt2);
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
          return d.Year == year && d.Weight > 10000;
        }
        else {
          return productRange.includes(d.Category) && d.Year == year && d.Weight > 10000 ;
        }
      }));
    }
  }, [productRange, year]);

  useEffect(() => {
    console.log("tracked changed");
    console.log(trackedProducts);
    if (dataset) {
      let filt2 = dataset.filter(function (d) {
        return trackedProducts.includes(d.Product_Name);
      });
      setFiltered2(filt2);    
    }
  }, [trackedProducts]);

  useEffect(() => {
    if (filtered && trackedProducts) {
      
      const dim = chartDimensions();
      
      const svgElement = d3.select(ref.current);

      let dataRoll = filtered.map((obj) => {
        obj.Weight = Number(obj.Weight);
        obj.Age = Number(obj.Age);
        return obj;
      });

      var xScale = d3.scaleLinear()
        .domain([0, d3.max(dataRoll, d => d.Age)])
        .range([0, dim.width]);
      
      yScale3 = d3.scaleLinear()
        .domain([-5000,d3.max(dataRoll, d => d.Weight)])
        .range([dim.height , 0]);


      
      //x scale axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale));



      svgElement.select("#legend").call(colorLegend);

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


      //old way of doing this i honestly think this is lowkey better
      const info = svgElement.select("#rectGroup").selectAll("circle")
      .data(dataRoll, function(d) { return d.Product_Name; })
      .join(enter => enter.append("circle")
        .on("mouseover", function (event, d) { 
          svgElement.select("#tooltipGroup")
          // move the tooltip to where the cursor is 
          .style("display", "block")
          .attr("transform", `translate(${dims.margin.left + xScale(d.Age) + 10}, ${dims.margin.top + yScale3(d.Weight) - 10})`)
           // <-- need to use the regular function definition to have access to "this"
          svgElement.select("#tooltip-text")
            .text(`${d.Product_Name}`);
          svgElement.select("#tooltip-text2")
            .text(`Estimated Injury Count: ${Math.round(d.Weight)}`);
            svgElement.select("#tooltip-text3")
            .text(`Median Age of Injury: ${d.Age}`);
          const textElement = textRef.current;
          const rectElement = rectRef.current;
          const gElement = textRef2.current;
          const bbox2 = gElement.getBBox();
          const bbox = textElement.getBBox();


          rectElement.setAttribute('x', bbox.x - 5);
          rectElement.setAttribute('y', bbox.y - 3);
          svgElement.select("#tooltip-text2").attr('y', bbox.height);
          svgElement.select("#tooltip-text3").attr('y', bbox.height * 2);
          rectElement.setAttribute('width', Math.max(bbox.width, bbox2.width) + 10);
          rectElement.setAttribute('height', bbox.height * 3 + 6);
          if (d3.select(this).attr("stroke") != "black") {
            d3.select(this)
              .attr("stroke", "#333333")
              .attr("stroke-width", 3);
          }
        })
        .on("mouseout", function (event, d) {
          svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
          if (d3.select(this).attr("stroke-width") != 4) {
            d3.select(this).attr("stroke-width", 1);
          }
        })
        .on("click", function (event, d) {
          if (d3.select(this).attr("stroke") != "black") {
            d3.select(this).attr("stroke-width", 4);
            d3.select(this).attr("stroke", "black");
            handleAdd(d.Product_Name);
          }
          else {
            if (handleRemove(d.Product_Name)) {
              d3.select(this)
                .attr("stroke", "#333333")
                .attr("stroke-width", 3);
            }
            
          }
        })
        /** 
        .attr("cx", d => xScale(Number(d.Age)))
        .attr("cy", d => yScale3(Number(d.Weight)))
        */
        .attr("r", 5)
        .attr("fill", d => myColor(d.Category))
        .attr("opacity", 1)
        .attr("class", "circleClass")
        .attr("stroke", d => {
          if (trackedProducts.includes(d.Product_Name)) {
            return "black";
          }
          else {
            return "#333333";
          }
        })
        .attr("stroke-width", d => {
          if (trackedProducts.includes(d.Product_Name)) {
            return 4;
          }
          else {
            return 1;
          }
        })
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
        .on("mouseover", function (event, d) {
          svgElement.select("#tooltipGroup")
          // move the tooltip to where the cursor is 
          .style("display", "block")
          .attr("transform", `translate(${dims.margin.left + xScale(d.Age) + 10}, ${dims.margin.top + yScale3(d.Weight) - 10})`)  // <-- need to use the regular function definition to have access to "this"
          svgElement.select("#tooltip-text")
            .text(`${d.Product_Name}`);
          svgElement.select("#tooltip-text2")
            .text(`Estimated Injury Count: ${Math.round(d.Weight)}`);
          svgElement.select("#tooltip-text3")
            .text(`Median Age of Injury: ${d.Age}`);
          const textElement = textRef.current;
          const rectElement = rectRef.current;
          const gElement = textRef2.current;
          const bbox2 = gElement.getBBox();
          const bbox = textElement.getBBox();
          rectElement.setAttribute('x', bbox.x - 5);
          rectElement.setAttribute('y', bbox.y - 3);
          svgElement.select("#tooltip-text2").attr('y', bbox.height);
          svgElement.select("#tooltip-text3").attr('y', bbox.height * 2);
          rectElement.setAttribute('width', Math.max(bbox.width, bbox2.width) + 10);
          rectElement.setAttribute('height', bbox.height * 3 + 6);

          if (d3.select(this).attr("stroke") != "black") {
            d3.select(this)
              .attr("stroke", "#333333")
              .attr("stroke-width", 3);
          }
        })
        .on("mouseout", function (event, d) {
          svgElement.select("#tooltipGroup").style("display", "none"); // hide tooltip
          if (d3.select(this).attr("stroke-width") != 4) {
            d3.select(this).attr("stroke-width", 1);
          }
        })
        .on("click", function (event, d) {
          if (d3.select(this).attr("stroke") != "black") {
            d3.select(this).attr("stroke-width", 4);
            d3.select(this).attr("stroke", "black");
            handleAdd(d.Product_Name);
          }
          else {
            if (handleRemove(d.Product_Name)) {
              d3.select(this)
                .attr("stroke", "#333333")
                .attr("stroke-width", 3);
            }
          }
        });
      
      info.transition()
        .duration(1000)
        .ease(d3.easeCubic)
        .attr("cx", d => xScale(d.Age))
        .attr("cy", d => yScale3(d.Weight))
        .attr("r", 5)
        .attr("fill", d => myColor(d.Category))
        .attr("opacity", 1);



    }
  }, [filtered, trackedProducts]);

  useEffect(() => {
    const dim = chartDimensions();
    const svgElement = d3.select(ref3.current);
    if (filtered2) {
      let dataRoll = filtered2.map((obj) => {
        obj.Weight = Number(obj.Weight);
        obj.Year = Number(obj.Year);
        obj.Age = Number(obj.Age);
        return obj;
      });
      dataRoll = d3.groups  (dataRoll, d => d.Product_Name).map(([product_name, values]) => {
        return {Product_Name: product_name, values: values}
      });
      
      console.log("lined data: ", dataRoll);



      var xScale = d3.scaleLinear()
      .domain(d3.extent(dataRoll[0].values, function(d) {return d.Year;}))
      .range([0, dim.width]);

      var yScale = d3.scaleLinear()
        .domain([0,d3.max(dataRoll, v => d3.max(v.values, d => d.Age))])
        .range([dim.height , 0]);

      let lineGenerator = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.Age));

      //x-axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(200)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

      //y-axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale));

      //coloration
      const myColor2 = d3.scaleOrdinal().domain(trackedProducts)
        .range(d3.schemeCategory10);

      var colorLegend = legendColor()
        .labelFormat(d3.format(".2f"))
        .title("Product Names")
        .titleWidth(175)
        .labelWrap(175)
        .scale(myColor2);
  
      

      const info = svgElement.select("#rectGroup").selectAll("path")
        .data(dataRoll, function(d) {return d.Product_Name;})
        .join(enter => enter.append("path")
          .attr("d", d => lineGenerator(d.values))
          .attr("fill", "none")
          .attr("stroke", d => myColor2(d.Product_Name))
          .attr("stroke-width", 1.5)
          ,
          update => update,
          exit => exit.transition().duration(300).ease(d3.easeCubic).attr("opacity", 0).remove()
        );
      info.transition()
        .duration(300)
        .ease(d3.easeCubic)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => myColor2(d.Product_Name));



      }
    
  }, [filtered2]);
  useEffect(() => {
    const dim = chartDimensions();
    const svgElement = d3.select(ref2.current);
    if (filtered2) {
      console.log("filtered2 changing");
      let dataRoll = filtered2.map((obj) => {
        obj.Weight = Number(obj.Weight);
        obj.Year = Number(obj.Year);
        return obj;
      });
      dataRoll = d3.groups  (dataRoll, d => d.Product_Name).map(([product_name, values]) => {
        return {Product_Name: product_name, values: values}
      });
      
      console.log("lined data: ", dataRoll);



      var xScale = d3.scaleLinear()
      .domain(d3.extent(dataRoll[0].values, function(d) {return d.Year;}))
      .range([0, dim.width]);

      var yScale = d3.scaleLinear()
        .domain([-5000,d3.max(dataRoll, v => d3.max(v.values, d => d.Weight))])
        .range([dim.height , 0]);

      let lineGenerator = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.Weight));

      //x-axis
      svgElement.select("#xAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.height + dim.margin.top})`)
      .transition()
      .duration(200)
      .ease(d3.easeQuad)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

      //y-axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale3));

      //coloration
      const myColor2 = d3.scaleOrdinal().domain(trackedProducts)
      .range(d3.schemeCategory10);

      var colorLegend = legendColor()
        .labelFormat(d3.format(".2f"))
        .title("Product Names")
        .titleWidth(175)
        .labelWrap(175)
        .scale(myColor2);
  
      svgElement.select("#legend").call(colorLegend);

      const info = svgElement.select("#rectGroup").selectAll("path")
        .data(dataRoll, function(d) {return d.Product_Name;})
        .join(enter => enter.append("path")
          .attr("d", d => lineGenerator(d.values))
          .attr("fill", "none")
          .attr("stroke", d => myColor2(d.Product_Name))
          .attr("stroke-width", 1.5)
          ,
          update => update,
          exit => exit.transition().duration(300).ease(d3.easeCubic).attr("opacity", 0).remove()
        );
      info.transition()
        .duration(300)
        .ease(d3.easeCubic)
        .attr("d", d => lineGenerator(d.values))
        .attr("stroke", d => myColor2(d.Product_Name));



      }
    
  }, [filtered2]);

  const ref = useRef();
  const ref2 = useRef();
  const ref3 = useRef();


  return (
    <div style={{width:'90%'}}>
    <div style={{width:'100%',display: 'flex', flexDirection: 'row'}}>
      <div style={{width:'80%',}}>
        <svg
          viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
          ref={ref}
        >
          <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right + 50}, ${dims.margin.top + 30})`}></g>
          <text id="yAxisLabel"x={-(dims.margin.top + dims.height / 2)} y={30} transform={`rotate(${-90})`} textAnchor="middle" fontSize={15} >Total Estimated Injury Count</text>
          <text x={dims.margin.left + dims.width / 2} y={dims.svgHeight - 20} textAnchor="middle" fontSize={15} >Median Age of Injury</text>
          <g id="tooltipGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`} >          <rect rx="5" fill="white" style={{stroke: 'black'}} ref={rectRef} ></rect> <text id="tooltip-text" fontSize={14} fontWeight="bold" ref={textRef}></text> <text id="tooltip-text2" fontSize={10} fontWeight="bold" ref={textRef2} ></text> <text id="tooltip-text3" fontSize={10} fontWeight="bold" ></text></g>
        </svg>
      </div>
      <div style={{width: '20%', display: 'flex', flexDirection: 'column'}}>
      <Box sx={{ width: '100%', paddingBottom: '50px'}}>
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
      <Box sx={{ width: '100%'}}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Year</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={year}
          label="Year"
          onChange={handleChange}
        >
          {yearList.map((value, index) => {
            return (<MenuItem key = {index} value = {value}>{value}</MenuItem>);
          })}
        </Select>
      </FormControl>
      </Box>
      </div>
    </div>
      <div style={{width: '100%', display: 'flex', flexDirection: 'row'}}>
      <div style={{width: '50%'}}>
      <svg
          viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
          ref={ref2}
        >
          <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <text id="yAxisLabel"x={-(dims.margin.top + dims.height / 2)} y={30} transform={`rotate(${-90})`} textAnchor="middle" fontSize={15} >Total Estimated Injury Count</text>
          <text x={dims.margin.left + dims.width / 2} y={dims.svgHeight - 20} textAnchor="middle" fontSize={15} >Year</text>
          <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right + 20}, ${dims.margin.top + 30})`}></g>
      </svg>
      </div>
      <div style={{width: '50%'}}>
      <svg
          viewBox={`0 0 ${dims.svgWidth} ${dims.svgHeight}`}
          ref={ref3}
        >
          <g id="xAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="yAxis" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <g id="rectGroup" transform={`translate(${dims.margin.left}, ${dims.margin.top})`}></g>
          <text id="yAxisLabel"x={-(dims.margin.top + dims.height / 2)} y={50} transform={`rotate(${-90})`} textAnchor="middle" fontSize={15} >Median Age of Injury</text>
          <text x={dims.margin.left + dims.width / 2} y={dims.svgHeight - 20} textAnchor="middle" fontSize={15} >Year</text>
          <g id="legend" transform={`translate(${dims.svgWidth - dims.margin.right + 30}, ${dims.margin.top + 30})`}></g>
      </svg>
      </div>
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
      margin: {top: 20, left: 100, bottom: 90, right: 20}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }
  
  const dims = chartDimensions();


  const [dataset, setDataset] = useState(null);
  const [filtered, setFiltered] = useState(null);

  useEffect(() => {
    d3.csv('/body_parts.csv')
      .then((data) => {
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
    }
  }, [ageRange]);

  useEffect(() => {
    console.log("filter changed");
    if (filtered) {


      const dim = chartDimensions();
      
      const svgElement = d3.select(ref.current);
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
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", `translate(${0})rotate(-20)`)
      .style("text-anchor", "end")
      .style("font-size", "7")
      ;
      //y scale axis
      svgElement.select("#yAxis")
      .attr('transform', `translate(${dim.margin.left}, ${dim.margin.top})`)
      .transition()
      .duration(1000)
      .ease(d3.easeQuad)
      .call(d3.axisLeft(yScale));
      

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
        <text id="yAxisLabel"x={-(dims.margin.top + dims.height / 2)} y={20} transform={`rotate(${-90})`} textAnchor="middle" fontSize={12} >Total Estimated Injury Count</text>
        <text x={dims.margin.left + dims.width / 2} y={dims.svgHeight - 35} textAnchor="middle" fontSize={12} >Body Part</text>
        
      </svg>
      <div>
      <div style={{width: '75%', display:'flex', flexDirection:'row'}}>
        <div>
        <p>Age Range for Injuries:</p>
        </div>
        <Slider
        sx={{width: '50%', marginLeft: '40px', marginTop: '10px'}}
        getAriaLabel={() => 'Age range'}
        value={ageRange}
        onChange={handleChange}
        min={1}
        max={120}
        step={1}
        valueLabelDisplay="on"
        />
      </div>

       </div>
    </div>
  );
}


const Response = () => {
  const chartDimensions = () => {
    let dimensions = {
      svgWidth: 1000,
      svgHeight: 400,
      margin: {top: 60, left: 100, bottom: 60, right: 100}
    };
    dimensions.width = dimensions.svgWidth - dimensions.margin.left - dimensions.margin.right;
    dimensions.height = dimensions.svgHeight - dimensions.margin.top - dimensions.margin.bottom;
    return dimensions;
  }

  const dims = chartDimensions();
  const ref = useRef();

  const [ageRange, setAgeRange] = useState("");
  const [sex, setSex] = useState("");
  const [race, setRace] = useState("");
  const [filtered, setFiltered] = useState(null);
  const [dataset, setDataset] = useState(null);

  const [text1, setText1] = useState("");
  const [productName, setProductName] = useState("");
  const [productChance, setProductChance] = useState("");
  const [text2, setText2] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisChance, setDiagnosisChance] = useState("");
  const [text3, setText3] = useState("");
  const [bpart, setBpart] = useState("");
  const [bpartChance, setBpartChance] = useState("");
  const [text4, setText4] = useState("");
  const [narrative, setNarrative] = useState("");
  const [text5, setText5] = useState("");



  const ageTypes = ["", "1-10", "11-20", "21-30", "31-40", "41-65", "65-100"];
  const ages = {"": [], "1-10": [1,10], "11-20": [11,20], "21-30": [21,30], "31-40":[31,40], "41-65":[41, 65], "65-100": [65, 100] }
  const sexTypes = ["","MALE", "FEMALE", "NON-BINARY/OTHER"];
  const raceTypes = ["","WHITE", "BLACK/AFRICAN AMERICAN","OTHER","ASIAN","AMERICAN INDIAN/ALASKA NATIVE","NATIVE HAWAIIAN/PACIFIC ISLANDER"];

  const handleChange = (event) => {
    setAgeRange(event.target.value);
  };
  const handleSexChange = (event) => {
    setSex(event.target.value);
  };
  const handleRaceChange = (event) => {
    setRace(event.target.value);
  };

  const handleClick = () => {
    if (ageRange != "" && sex != "" && race != "") {
      let ageBr = ages[ageRange];
      let filt = dataset.filter(function(d) {
        return (d.Age >= ageBr[0] && d.Age <= ageBr[1]) && (d.Sex2 == sex) && (d.Race2 == race) && (d.Diag != "OTHER")
      })
      console.log("its filt:", filt);
      if (filt.length > 0) {
        setFiltered(filt);
      }
      else {
        setText1("Unfortunately we don't have enough data for this demographic!");
        setText2("");
        setText3("");
        setText4("");
        setText5("");
        setBpart("");
        setBpartChance("");
        setProductName("");
        setProductChance("");
        setDiagnosis("");
        setDiagnosisChance("");
      }
      
    }
    else {
      setText1("Please submit your information properly!");
      setText2("");
      setText3("");
      setText4("");
      setText5("");
      setBpart("");
      setBpartChance("");
      setProductName("");
      setProductChance("");
      setDiagnosis("");
      setDiagnosisChance("");
    }
  }
  

  function getRandomString(arr) {
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
      total += arr[i][1];
    }
    let randomNum = Math.random() * total;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i][1];
      if (randomNum <= sum) {
        return [arr[i][0], arr[i][1] / total];
      }
    }
  }

  useEffect(() => {
    if (filtered) {
      const svgElement = d3.select(ref.current);

      let rollProduct = d3.rollups(filtered, v => d3.sum(v, d => d.Weight), d => d.Product_Name);
      let [product, prodChance] = getRandomString(rollProduct);
      let filtered2 = filtered.filter(function (d) {
        return d.Product_Name == product;
      });

      let rollDiag = d3.rollups(filtered2, v => d3.sum(v, d => d.Weight), d => d.Diag);
      let [diag, diagChance] = getRandomString(rollDiag);
      let filtered3 = filtered2.filter(function (d) {
        return d.Diag == diag;
      });
      let rollBP = d3.rollups(filtered3, v => d3.sum(v, d => d.Weight), d => d.BodyPart);
      let [bp, bpChance] = getRandomString(rollBP);
      let filteredFINAL = filtered3.filter(function (d) {
        return d.BodyPart == bp;
      });

      console.log(filteredFINAL);
      let rollNarr = d3.rollups(filteredFINAL, v => d3.sum(v, d => d.Weight), d => d.Narrative_1);
      let narr = getRandomString(rollNarr)[0];
      setText1(`You were using`);
      setProductName(` ${product.replace(/\([^)]*\)?/g, '').trim()}`);
      setProductChance(`(${Math.round(prodChance * 100 * 100) / 100}\% chance)`);
      setText2(`when you suffered a`);
      setDiagnosis(`${diag}`);
      setDiagnosisChance(`(${Math.round(diagChance * 100 * 100) / 100}\% chance given product)`);
      setText3(`to your`);
      setBpart(`${bp}`);
      setBpartChance(`(${Math.round(bpChance * 100 * 100) / 100}\% chance given product and diagnosis)`);
      setText4(`Your injury report:`);
      setNarrative(`${narr}`);
      setText5(`Around ${Math.round(d3.sum(filteredFINAL, d => d.Weight))} others also experienced this injury this year!`);



    }
  }, [filtered]);






  useEffect(() => {
    d3.csv('/formatter.csv')
      .then((data) => {
        setDataset(data);
      })
      .catch((err) => {
        console.log(err)
        console.log("csv error");
        return null;
    });
  }, []);


  

  return (
    <div style={{width:'90%', display: "flex", flexDirection: 'column', alignContent: 'center'}}>
      <div  style={{width:'90%', display: "flex", flexDirection: 'row'}}>
      <h3 style={{paddingRight:'10px'}}> I am </h3>
      <Box sx={{ minWidth: 120, maxWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={ageRange}
          label="Age Range"
          onChange={handleChange}
        >
          {ageTypes.map((value, index) => {
            return (<MenuItem key = {index} value = {value}>{value}</MenuItem>);
          })}
        </Select>
      </FormControl>
      </Box>
      <h3 style={{paddingLeft:'10px', paddingRight:'10px'}}> years old. </h3>
      <h3 style={{paddingRight:'10px'}}> I am </h3>
      <Box sx={{ minWidth: 120, maxWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Sex</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sex}
          label="Sex"
          onChange={handleSexChange}
        >
          {sexTypes.map((value, index) => {
            return (<MenuItem key = {index} value = {value}>{value}</MenuItem>);
          })}
        </Select>
      </FormControl>
      </Box>
      <h3 style={{paddingLeft:'10px', paddingRight:'10px'}}> and </h3>
      <Box sx={{ minWidth: 250, maxWidth: 250 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Race</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={race}
          label="Race"
          onChange={handleRaceChange}
        >
          {raceTypes.map((value, index) => {
            return (<MenuItem key = {index} value = {value}>{value}</MenuItem>);
          })}
        </Select>
      </FormControl>
      </Box>
      <div style={{paddingTop: '10px', paddingLeft: '10px'}}>
        <Button  variant="contained" color="success" onClick={handleClick}>
        Generate
        </Button> 
      </div>    
      </div>
      <div style={{width: '90%',display: 'flex', flexDirection: 'column', alignContent: 'center'}}>
        <br></br>
          <div style={{paddingTop: '10px', paddingBottom:'10px' ,borderStyle:'solid', backgroundColor: 'lightgray', borderWidth: '3px'}}>
          <div style={{width: '100%', display: 'flex', flexDirection: 'row', fontSize: 18, justifyContent: 'center', }}>
            <p style={{paddingTop:'3px',paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Monaco'}}>{text1}</p> 
            <div style={{display: 'flex', flexDirection: 'column'}}>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Menlo', fontWeight:'bold',fontSize: 26}}>{productName}</p>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px',fontSize: 15}}>{productChance}</p>
            </div>
          </div>
          <br></br>
          <div style={{width: '100%', display: 'flex', flexDirection: 'row', fontSize: 18, justifyContent: 'center'}}>
            <p style={{paddingTop:'3px',paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Monaco'}}>{text2}</p> 
            <div style={{display: 'flex', flexDirection: 'column'}}>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Menlo', fontWeight:'bold',fontSize: 26}}>{diagnosis}</p>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px',fontSize: 15}}>{diagnosisChance}</p>
            </div>
          </div>
          <br></br>
          <div style={{width: '100%', display: 'flex', flexDirection: 'row', fontSize: 18, justifyContent: 'center'}}>
            <p style={{paddingTop:'3px',paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Monaco'}}>{text3}</p> 
            <div style={{display: 'flex', flexDirection: 'column'}}>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px', fontFamily:'Menlo', fontWeight:'bold', fontSize: 26}}>{bpart}</p>
            <p style={{paddingRight:'10px', marginBlockStart:'0px', marginBlockEnd:'0px',fontSize: 15}}>{bpartChance}</p>
            </div>
          </div>
          </div>
          <p style={{fontSize: 18, fontFamily:'Monaco'}}>{text5}</p>
          <div style={{paddingTop: '10px', paddingBottom:'10px' ,borderStyle:'solid', backgroundColor: 'lightgray', borderWidth: '3px', display: 'flex', flexDirection: 'column', alignItems:'center'}}>
          <div style={{width: '90%'}}>
          <p style={{fontSize: 18, fontFamily:'Monaco'}}>{text4}</p>
          <p style={{fontSize: 24, fontFamily:'Monaco'}}>{narrative}</p>
          </div>
          </div>
          <br></br>
          
          
      </div>
      
      
    
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
        <div style={{width: '90%', flexDirection: 'column', alignItems: 'center', display: "flex"}}>
          <div style={{width: '80%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
            <h1>Consumer Product-Related Injuries in the U.S</h1>
            <p>The National Electronic Injury Surveillance System (NEISS) dataset is a publicly available database of emergency room visits related to consumer product injuries in the United States. Data has been collected for the past 45 years, with the past 20 years being openly available online. Each dataset consists of around a few hundred thousand injury reports, with each report including information on the type of product involved in the injury, the nature and severity of the injury, and demographic information about the injured person. Exploring this dataset will showcase how consumer product injuries have changed over the years, and how and where these products are causing injury. </p>
            <br></br><br></br><br></br>
          <h2 style={{marginBlockStart:'0px', marginBlockEnd:'0px'}}>Product-Related Injuries by Category over the Years</h2>
          <p> The chart below shows the estimated injury counts for each year, categorized by type of consumer product. You can view the percentage breakdown for each category by clicking the checkbox. Overall, we can see that product injuries remained steady year-over-year until experiencing a significant decline in 2020, most likely as a result of the COVID-19 lockdown, then began to return to previous levels in 2021. When we view the percentage breakdown, we can see that most categories followed the same trend of staying steady year-over-year. However, in 2020, two categories saw fairly large deviations in their injury counts -- sports and recreation went from 26.42% in 2019 to 22.02% in 2020, whereas household fixtures went from 51.48% in 2019 to 53.52%. All other categories saw a less than 1% deviation from the previous year.</p>
          </div>

          
        <TimeBars></TimeBars>
        <br></br><br></br><br></br><br></br>
        

        <div style={{width: '80%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
        <h2 style={{marginBlockStart:'0px', marginBlockEnd:'0px'}}>Injury Counts and Median Injury Age of Products</h2>
        <p>Let's examine the individual consumer products that are causing injury. Here, we have a plot of every single product with over 10000 estimated injuries, showing the median age of individuals injured by that product alongside the estimate with their estimated injury count. Let's examine the two highest injury count products in 2021, "Floors or flooring materials" and "Stairs or steps", which are highlighted with thicker borders. We can look at the two line graphs at the bottom to see how the injury counts and the median age of injury has changed over the past 10 years -- originally, stairs and steps caused more injuries, but has decreased steadily over time, whereas flooring materials' injury count has increased over the past 10 years. Change the category and the year on the menus on the side to isolate certain product types and see the spread across the years, and click on individual points to view their overall trends!</p>
        </div>
        <div style={{width: '90%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
          <ProductsCircles />
        </div>
        
        <br></br><br></br><br></br><br></br>
        <div style={{width: '80%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
        <h2 style={{marginBlockStart:'0px', marginBlockEnd:'0px'}}>Injuries by Age and Body Location</h2>
        <p>Here we've charted the distribution of the body parts which most often sustain injuries. We can also adjust the age range for the data, to see if people of certain ages are more susceptible to injuring certain body parts. Across all ages, we can see that head injuries are the most common, which stays consistent across most age ranges. However, if we change the range to people age 20-45, we can see that they are more frequently admitted for finger injuries, and for children aged 1-7, we can see that they are more often admitted for facial injuries, whereas it as only 4th most common when considering all age groups.</p>
        </div>
        <AgeBars />
        <br></br><br></br><br></br><br></br>
        <div style={{width: '80%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
        <h2 style={{marginBlockStart:'0px', marginBlockEnd:'0px'}}>How might I get injured?</h2>
        <p>Want to figure out what you should stay away from and what might be the most likely injury for you? Tell us a bit about yourself and we'll generate an injury that's likely to occur for you! This is done by randomly sampling from individuals in the same demographic as you, starting by sampling the product, then the diagnosis, then the body part. The probability of each event occurring is provided. </p>
        <br></br>
        </div>
        <Response></Response>
        <div style={{width: '80%', display: "flex", alignItems: "center", flexDirection: 'column',}}>
        <h2 >References</h2>
        <p style={{marginBlockStart:'2px', marginBlockEnd:'2px'}}>The main chunks of this website were built using <a href="https://react.dev">React</a> and hosted using <a href="https://nextjs.org">Next.js</a>. </p>
        <p style={{marginBlockStart:'2px', marginBlockEnd:'2px'}}>All charts were built using <a href="https://d3js.org">D3</a> </p>
        <p style={{marginBlockStart:'2px', marginBlockEnd:'2px'}}>Data sourced from the <a href="https://www.cpsc.gov/cgibin/NEISSQuery/home.aspx">NEISS website</a>, and cleaned/preprocessed using a combination of Excel, Tableau, and R</p>
        </div>
        <br></br>
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
