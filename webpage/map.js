    // The svg
    var svg = d3.select("svg"),
      width = +svg.attr("width"),
      height = +svg.attr("height");
    
    // Map and projection
    var path = d3.geoPath();
    var projection = d3.geoMercator()
      .scale(4700)
      .center([-79.0193, 35.7596])
      .translate([width / 2, height / 2]);
    
    // Data and color scale
    var data = d3.map();
    var colorScale = d3.scaleThreshold()
      .domain([0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
      .range(d3.schemeBlues[7]);
    
    // Load external data and boot
    d3.queue()
      .defer(d3.json, "data/North_Carolina_State_and_County_Boundary_Polygons.geojson")
      .defer(d3.csv, "data/2022NCIncome.csv", function(d) { data.set(d.County, { income: +d.Income }); })
      .defer(d3.csv, "data/2022NCFMR.csv", function(d) { 
        if (data.has(d.County)) {
          data.get(d.County).oneBR = +d.OneBR;
        } else {
          data.set(d.County, { oneBR: +d.OneBR });
        }
      })
      .await(ready);

    console.log(data);
    
    function ready(error, topo) {
      //console.log(topo.features);
      // Draw the map
      let counties = svg.append("g")
      .selectAll("path")
      .data(topo.features)
    counties
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("id", function(d) { return d.properties.County; })
        // draw each county
      .attr("d", d3.geoPath()
        .projection(projection)
        )
        // set the color of each county to reflect the percentage of OneBR relative to Income
        .attr("fill", function (d) {
          var countyData = data.get(d.properties.County) || { income: 0, oneBR: 0 };
          var monthlyIncome = countyData.income / 12;
          var percentage = countyData.income ? (countyData.oneBR / monthlyIncome) : 0;
          return colorScale(percentage);
        })
        //on click display the county name and percentage in a tooltip  
        .on("click", function(d) {
          //remove selected class from all counties
          d3.selectAll(".county").classed("selected", false);
          //unhide the details span
          //display the county name and percentage in the details span  
          var countyData = data.get(d.properties.County) || { income: 0, oneBR: 0 };
          var monthlyIncome = countyData.income / 12;
          var percentage = countyData.income ? (countyData.oneBR / monthlyIncome) : 0;
          d3.select("#details")
          .text(d.properties.County + ": " + (percentage * 100).toFixed(2) + "%")
          //have the details span follow the cursor
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px")
          //.transition()
          //.duration(300)
          .style("opacity", 1);
          //add the selected class to the clicked county
          d3.select(this).classed("selected", true);
        })
      }