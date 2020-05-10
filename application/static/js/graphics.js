// For now, algorithm may be:
// 1. CN2
// 2. PRIM
const redraw = (graphData, cols, col_output, algorithm) => {
    d3.select('#chartArea svg').remove();

    const chartArea = document.getElementById('chartArea');
    const padding = parseFloat(window.getComputedStyle(chartArea).getPropertyValue('padding-left'));
    const width = chartArea.clientWidth - 2*padding;

    const height = width / 2.1;

    const svg = d3.select('#chartArea')
        .append('svg')
           .attr('width', width)
           .attr('height', height);

    // Used for proportions
    const maxWidth = 760;
    const prop = width / maxWidth > 1 ? 1 : width / maxWidth;

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

      random_jitterX = d => xScale(xValue(d)) + Math.random()*5;
      random_jitterY = d => yScale(yValue(d)) - Math.random()*5;
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
        .tickPadding(15);

      const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(15);

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

      if(algorithm == "CN2"){
        g.selectAll('circle').data(data)
            .enter().append('circle')
              .attr('cy', d => d.jitterY)
              .attr('cx', d => d.jitterX)
              .attr('r', d => Math.sqrt(d["weights"]) * circleRadius)
              .attr('fill', d => colorScale(colorValue(d)))
              .style("opacity", 0.5)
              .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(colX+": "+d[colX]+"<br/>"+colY+": "+d[colY])
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 32) + "px");
               })
              .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
              });
      } else if(algorithm == "PRIM"){
        g.selectAll('circle').data(data)
            .enter().append('circle')
              .attr('cy', d => d.jitterY)
              .attr('cx', d => d.jitterX)
              .attr('r', d => circleRadius)
              .attr('fill', d => colorScale(colorValue(d)))
              .style("stroke", d => d["In_current_box"] == 1 ? "black" : "transparent")
              .style("opacity", 0.5)
              .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(colX+": "+d[colX]+"<br/>"+colY+": "+d[colY])
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 32) + "px");
               })
              .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
              });
      }


      g.append('text')
          .attr('class', 'title')
          .attr('y', prop*-10)
          .text(title);
      colorLegendG.call(colorLegend)
          .selectAll('.cell text')
            .attr('font-size', '0.8rem')
            .attr('dy', '0.1em');
      colorLegendG.call(colorLegend)
          .selectAll('.cell circle')
            .attr('r', circleRadius);

    };
    render(graphData);
}