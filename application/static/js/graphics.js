const redraw_CN2 = (graphData, cols, col_output) => {
    d3.select('#chartArea svg').remove();

    const chartArea = document.getElementById('chartArea');
    const padding = parseFloat(window.getComputedStyle(chartArea).getPropertyValue('padding-left'));
    const width = chartArea.clientWidth - 2*padding;

    const height = width / 2;

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

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, xValue))
        .range([0, innerWidth])
        .nice();

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, yValue))
        .range([innerHeight, 0])
        .nice();

      const colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(15);

      const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(10);

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

      g.selectAll('circle').data(data)
        .enter().append('circle')
          .attr('cy', d => yScale(yValue(d)))
          .attr('cx', d => xScale(xValue(d)))
          .attr('r', d => Math.sqrt(d["weights"]) * circleRadius)
          .attr('fill', d => colorScale(colorValue(d)))
          .style("opacity", 0.5);

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

const redraw_PRIM = (graphData, cols, col_output) => {
    d3.select('#chartArea svg').remove();

    const chartArea = document.getElementById('chartArea');
    const padding = parseFloat(window.getComputedStyle(chartArea).getPropertyValue('padding-left'));
    const width = chartArea.clientWidth - 2*padding;

    const height = width / 2.15;

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

      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, xValue))
        .range([0, innerWidth])
        .nice();

      const yScale = d3.scaleLinear()
        .domain(d3.extent(data, yValue))
        .range([innerHeight, 0])
        .nice();

      const colorScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xAxis = d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickPadding(15);

      const yAxis = d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickPadding(10);

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

      g.selectAll('circle').data(data)
        .enter().append('circle')
          .attr('cy', d => yScale(yValue(d)))
          .attr('cx', d => xScale(xValue(d)))
          .attr('r', d => circleRadius)
          .attr('fill', d => colorScale(colorValue(d)))
          .style("opacity", 0.5);

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
