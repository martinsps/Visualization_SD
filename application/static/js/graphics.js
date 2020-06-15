// For now, algorithm may be:
// 1. CN2
// 2. PRIM (typeBoundary and valueBoundary for drawing boundary found)
const redraw = (graphData, cols, col_output, algorithm, end, subgroups) => {
    d3.select('#chartArea svg').remove();
    const chartArea = document.getElementById('chartArea');
    const padding = parseFloat(window.getComputedStyle(chartArea).getPropertyValue('padding-left'));
    const width = chartArea.clientWidth - 2*padding;

    const height = width / 2.1;

    const svg = d3.select('#chartArea')
        .append('svg')
           .attr('width', width)
           .attr('height', height)
           .style('overflow', 'visible');

    // Used for proportions
    const maxWidth = 760;
    const prop = width > maxWidth ? 1 : width / maxWidth;

    // The newest found is the X (from PRIM)
    const colX = cols[0];
    const colY = cols[1];

    const render = data => {
      const title = `${colY} vs. ${colX}`;
      const xValue = d => d[colX];
      const xAxisLabel = colX;
      const yValue = d => d[colY];
      const yAxisLabel = colY;
      const colorLabel = col_output;

      var circleRadius = prop*10;

      const margin = { top: 50*prop, right: 220*prop, bottom: 95*prop, left: 120*prop };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      var xScale;
      if(typeof data[0][colX] == "number"){
        xScale = d3.scaleLinear()
            .domain(d3.extent(data, xValue))
            .range([0, innerWidth])
            .nice();
      } else{
        xScale = d3.scalePoint()
            .domain(data.map(xValue))
            .range([0, innerWidth]);
      }
      var yScale;
      if(typeof data[0][colY] == "number"){
        yScale = d3.scaleLinear()
            .domain(d3.extent(data, yValue))
            .range([innerHeight, 0])
            .nice();
      } else{
        yScale = d3.scalePoint()
            .domain(data.map(yValue))
            .range([innerHeight, 0]);
      }
      random_jitterX = d => xScale(xValue(d)) + Math.random()*4;
      random_jitterY = d => yScale(yValue(d)) - Math.random()*4;
      data.forEach(function(d,i) {
         d.jitterX = random_jitterX(d);
         d.jitterY = random_jitterY(d);
      })
      // Graph group
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // x axis
      const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(20);
      const xAxisG = g.append('g').call(xAxis)
        .attr('transform', `translate(0,${innerHeight})`);
      xAxisG.select('.domain').remove();
      xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', prop*80)
          .attr('x', innerWidth / 2)
          .attr('fill', 'black')
          .text(xAxisLabel);

      // y axis
      const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(20);
      const yAxisG = g.append('g').call(yAxis);
      yAxisG.selectAll('.domain').remove();
      yAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', prop*-85)
          .attr('x', -innerHeight / 2)
          .attr('fill', 'black')
          .attr('transform', `rotate(-90)`)
          .attr('text-anchor', 'middle')
          .text(yAxisLabel);

      // If screen size is big, resize labels
      if(prop == 1){
           const fontSize = '1.4em';
           yAxisG.selectAll('text')
                .style('font-size',fontSize);
           xAxisG.selectAll('text')
                .style('font-size',fontSize);
      }
      // Graph title
      g.append('text')
              .attr('class', 'title')
              .attr('y', prop*-25)
              .text(title);

      // Color scale for points and legend (or subgroups in last graph)
      const colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);
      const colorValue = d => d[col_output];

      // Functions for mouse over and mouseout events for showing
      // information about the points in the graph
      const funMouseover = d => {
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html(colX+": "+d[colX]+"<br/>"+colY+": "+d[colY])
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 32) + "px");
      }
      const funMouseout = d => {
        div.transition()
            .duration(500)
            .style("opacity", 0);
      }
      // Define the div for the tooltip (https://bl.ocks.org/d3noob/a22c42db65eb00d4e369)
      var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      // Normal graphs (color for class)
      if(!end){
         const colorLegendG = g.append('g')
            .attr('transform', `translate(${innerWidth + prop*50}, ${innerHeight/2 - prop*40})`);
         colorLegendG.append('text')
              .attr('class', 'legend-label')
              .attr('x', prop*-30)
              .attr('y', prop*-30)
              .text(colorLabel);

         // Legend with colors
         const colorLegend = d3.legendColor()
            .scale(colorScale)
            .shape('circle');
         // Radius and stroke of points vary according to algorithm
         var radiusFunc = d => {};
         var strokeFunc = d => {};
         if(algorithm.name == "CN2"){
            radiusFunc = d => Math.sqrt(d["weights"]) * circleRadius;
         } else if(algorithm.name == "PRIM"){
            radiusFunc = d => circleRadius;
            strokeFunc = d => d["In_current_box"] == 1 ? "black" : "transparent";
         }
         // Draw the points using functions defined by algorithms
         g.selectAll('path').data(data)
                .enter().append('circle')
                  .attr('cy', d => d.jitterY)
                  .attr('cx', d => d.jitterX)
                  .attr('r', radiusFunc)
                  .attr('fill', d => colorScale(colorValue(d)))
                  .style("stroke", strokeFunc)
                  .style("opacity", 0.5)
                  .on("mouseover", funMouseover)
                  .on("mouseout", funMouseout);
         colorLegendG.call(colorLegend)
              .selectAll('.cell text')
                .attr('font-size', '0.8rem')
                .attr('dy', '0.1em');
         colorLegendG.call(colorLegend)
              .selectAll('.cell circle')
                .attr('r', circleRadius);

         if(algorithm.name == "PRIM" && algorithm.drawBoundary){
              //MAKING ARROW
              svg.append("svg:defs").append("svg:marker")
                .attr("id", "triangle")
                .attr("refX", 6)
                .attr("refY", 6)
                .attr("markerWidth", prop*30)
                .attr("markerHeight", prop*30)
                .attr("markerUnits","userSpaceOnUse")
                .attr("orient", "auto")
                .append("path")
                    .attr("d", "M 0 0 12 6 0 12 3 6")
                    .style("fill", "red");
              const yBottom = innerHeight+prop*15;
              const yTop = -prop*15;
              if(algorithm.typeBoundary == "&lt;=" || algorithm.typeBoundary == "&lt;"){
                  algorithm.valueBoundary = +algorithm.valueBoundary
                  const xStart = xScale(algorithm.valueBoundary);
                  const xLeft = xScale(algorithm.valueBoundary) - prop*15;
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xStart)
                      .attr('y1',yBottom)
                      .attr('y2',yTop)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"));
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xLeft)
                      .attr('y1',yBottom)
                      .attr('y2',yBottom)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"))
                      .attr("marker-end", "url(#triangle)");
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xLeft)
                      .attr('y1',yTop)
                      .attr('y2',yTop)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"))
                      .attr("marker-end", "url(#triangle)");
              } else if(algorithm.typeBoundary == "&gt;=" || algorithm.typeBoundary == "&gt;"){
                  algorithm.valueBoundary = +algorithm.valueBoundary
                  const xStart = xScale(algorithm.valueBoundary);
                  const xRight = xScale(algorithm.valueBoundary) + prop*15;
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xStart)
                      .attr('y1',yBottom)
                      .attr('y2',yTop)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"));
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xRight)
                      .attr('y1',yBottom)
                      .attr('y2',yBottom)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"))
                      .attr("marker-end", "url(#triangle)");
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xRight)
                      .attr('y1',yTop)
                      .attr('y2',yTop)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"))
                      .attr("marker-end", "url(#triangle)");
              } else if(algorithm.typeBoundary == "!="){
                  const xStart = xScale(algorithm.valueBoundary);
                  const yTopTopX = yTop - 5;
                  const yBottomTopX = yTop + 5;
                  const yTopBottomX = yBottom - 5;
                  const yBottomBottomX = yBottom + 5;
                  const xLeftX = xStart - 5;
                  const xRightX = xStart + 5;
                  g.append('line')
                      .attr('x1',xStart)
                      .attr('x2',xStart)
                      .attr('y1',yBottom)
                      .attr('y2',yTop)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red")
                      .style("stroke-dasharray", ("3, 3"));
                  g.append('line')
                      .attr('x1',xLeftX)
                      .attr('x2',xRightX)
                      .attr('y1',yTopTopX)
                      .attr('y2',yBottomTopX)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red");
                  g.append('line')
                      .attr('x1',xLeftX)
                      .attr('x2',xRightX)
                      .attr('y1',yBottomTopX)
                      .attr('y2',yTopTopX)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red");
                  g.append('line')
                      .attr('x1',xLeftX)
                      .attr('x2',xRightX)
                      .attr('y1',yTopBottomX)
                      .attr('y2',yBottomBottomX)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red");
                  g.append('line')
                      .attr('x1',xLeftX)
                      .attr('x2',xRightX)
                      .attr('y1',yBottomBottomX)
                      .attr('y2',yTopBottomX)
                      .attr("stroke-width", 2.5)
                      .attr("stroke", "red");
              }
         }
      }
      // Last graph (color shows subgroup of each point and shape for class)
      else {
        const symbols = d3.scaleOrdinal(d3.symbols);
        // creates a generator for symbols
        const symbol = d3.symbol().size(prop*150);
        // Function that associates a point with its color by
        // checking subgroup (or subgroups)
        var colorFunc = d => colorScale(d["subgroup"]);
        if(algorithm.name == "PRIM"){
            // Just the color associated to the subgroup in the scale
            colorFunc = d => colorScale(d["subgroup"])
        } else if(algorithm.name == "CN2"){
            // We need to mix the colors correspondent to the
            // (maybe) multiple subgroups or to the empty list
            colorFunc = d => {
                var subgroup_list = d["subgroups"];
                if(subgroup_list.length == 0){
                    // First color for no subgroup
                    return colorScale(0);
                }
                if(subgroup_list.length == 1){
                    return colorScale(subgroup_list[0]);
                }
                var colors = new Array();
                subgroup_list.forEach(subgroup => {
                    var color = colorScale(subgroup);
                    colors.push($.Color(color));
                })
                return Color_mixer.mix(colors);
            }
        }
        g.selectAll("path").data(data)
              .enter().append("path")
              .attr("class", "point")
              .attr("d", d => symbol.type(symbols(d[col_output]))())
              .attr("transform", d => `translate(${d.jitterX},${d.jitterY})`)
              .attr('fill', colorFunc)
              .attr("stroke","black")
              .style("opacity", 0.8)
              .on("mouseover", funMouseover)
              .on("mouseout", funMouseout);
        const shapeLegendG = g.append('g')
            .attr('transform', `translate(${innerWidth + prop*50}, ${innerHeight/2 - prop*40})`)
        var legend = shapeLegendG.selectAll(".legend").data(symbols.domain())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 22 + ")"; });
        legend.append("path")
            .attr("d", function(d, i) { return symbol.type(symbols(d))(); })
            .attr("fill","white")
            .attr("stroke","black");
        legend.append("text")
            .attr("x", prop*22)
            .attr("y", 0)
            .attr("dy", ".35em")
            .style("text-anchor", "beginning")
            .text(function(d) { return d; });
        shapeLegendG.append('text')
            .attr('class', 'legend-label')
            .attr('x', prop*-30)
            .attr('y', prop*-30)
            .text(colorLabel);
        // Adding legend for subgroup color (in div)
        d3.select('#legend_subgroups svg').remove();
        // Offsets for the "no subgroup" class
        const offsetText = 120;
        const offsetCircle = 105;
        // Maximum classes in a line (not counting "no subgroup")
        const maxClasses = Math.floor((width -  offsetCircle)/ (prop*80));
        const heightSub = (Math.floor(subgroups.length / maxClasses) + 1) * 35;
        const legendSvg = d3.select('#legend_subgroups')
            .append('svg')
               .attr('width', width)
               .attr('height', heightSub);
        const legendGroup = legendSvg.append('g');
        const noG = legendGroup.append('g')
            .attr('transform', `translate(${40*prop}, 20)`);;
        noG.append('text')
            .attr('x', circleRadius + 10)
            .attr('y', 5)
            .text('No subgroup')
        noG.append('circle')
            .attr('cy', 0)
            .attr('cx', 0)
            .attr('r', circleRadius)
            .attr('fill', colorScale(0))
        var i = 1;
        var j = 0;

        subgroups.forEach(sub => {
            var newG = legendGroup.append('g')
               .attr('transform', `translate(${40*prop}, 20)`);
            legendGroup.append('text')
                .attr('x', offsetText + 80*i*prop)
                .attr('y', (j+1)*25)
                .text(i+j*(maxClasses-1))
            legendGroup.append('circle')
                .attr('cy', 20 + j*25)
                .attr('cx', offsetCircle + 80*i*prop)
                .attr('r', circleRadius)
                .attr('fill', colorScale(i+j*(maxClasses-1)))
            i+=1;
            // Next line
            if(i == maxClasses){
                i = 1;
                j += 1;
            }
        })
        }

    };
    render(graphData);
}