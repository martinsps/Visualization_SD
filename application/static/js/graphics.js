// For now, algorithm may be:
// 1. CN2
// 2. PRIM (typeBoundary and valueBoundary for drawing boundary found)
const redraw = (graphData, cols, col_output, algorithm, typeBoundary, valueBoundary, drawBoundary) => {
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
    const prop = width / maxWidth > 1 ? 1 : width / maxWidth;

    // The newest found is the X (from PRIM)
    const colX = cols[0];
    const colY = cols[1];

    const render = data => {

      const title = `${colY} vs. ${colX}`;

      const xValue = d => d[colX];
      const xAxisLabel = colX;

      const yValue = d => d[colY];
      var circleRadius = 10;
      circleRadius *= prop;

      const yAxisLabel = colY;

      const colorValue = d => d[col_output];
      const colorLabel = col_output;

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

      const colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(20);

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

      const xAxisG = g.append('g').call(xAxis)
        .attr('transform', `translate(0,${innerHeight})`);

      xAxisG.select('.domain').remove();

      xAxisG.append('text')
          .attr('class', 'axis-label')
          .attr('y', prop*80)
          .attr('x', innerWidth / 2)
          .attr('fill', 'black')
          .text(xAxisLabel);



      // If screen size is big, resize labels
      if(prop == 1){
           const fontSize = '1.4em';
           yAxisG.selectAll('text')
                .style('font-size',fontSize);
           xAxisG.selectAll('text')
                .style('font-size',fontSize);
      }

      const colorLegendG = g.append('g')
        .attr('transform', `translate(${innerWidth + prop*50}, ${prop*120})`);

      colorLegendG.append('text')
          .attr('class', 'legend-label')
          .attr('x', prop*-30)
          .attr('y', prop*-30)
          .text(colorLabel);

      const colorLegend = d3.legendColor()
        .scale(colorScale)
        .shape('circle');

      // Define the div for the tooltip (https://bl.ocks.org/d3noob/a22c42db65eb00d4e369)
      var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

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

      if(algorithm == "CN2"){
        g.selectAll('circle').data(data)
            .enter().append('circle')
              .attr('cy', d => d.jitterY)
              .attr('cx', d => d.jitterX)
              .attr('r', d => Math.sqrt(d["weights"]) * circleRadius)
              .attr('fill', d => colorScale(colorValue(d)))
              .style("opacity", 0.5)
              .on("mouseover", funMouseover)
              .on("mouseout", funMouseout);
      } else if(algorithm == "PRIM"){
        g.selectAll('circle').data(data)
            .enter().append('circle')
              .attr('cy', d => d.jitterY)
              .attr('cx', d => d.jitterX)
              .attr('r', d => circleRadius)
              .attr('fill', d => colorScale(colorValue(d)))
              .style("stroke", d => d["In_current_box"] == 1 ? "black" : "transparent")
              .style("opacity", 0.5)
              .on("mouseover", funMouseover)
              .on("mouseout", funMouseout);
      }

      g.append('text')
          .attr('class', 'title')
          .attr('y', prop*-25)
          .text(title);
      colorLegendG.call(colorLegend)
          .selectAll('.cell text')
            .attr('font-size', '0.8rem')
            .attr('dy', '0.1em');
      colorLegendG.call(colorLegend)
          .selectAll('.cell circle')
            .attr('r', circleRadius);


      if(drawBoundary){
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
          if(typeBoundary == "&lt;=" || typeBoundary == "&lt;"){
              valueBoundary = +valueBoundary
              const xStart = xScale(valueBoundary);
              const xLeft = xScale(valueBoundary) - prop*15;
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
          } else if(typeBoundary == "&gt;=" || typeBoundary == "&gt;"){
              valueBoundary = +valueBoundary
              const xStart = xScale(valueBoundary);
              const xRight = xScale(valueBoundary) + prop*15;
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
          } else if(typeBoundary == "!="){
              const xStart = xScale(valueBoundary);
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
    };
    render(graphData);
}