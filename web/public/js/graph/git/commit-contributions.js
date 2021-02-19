// based on: https://observablehq.com/@d3/focus-context
function renderCommitContributions(data, elementId) {
  let margin = {top: 30, right: 30, bottom: 30, left: 80},
    width = GraphConfig.width - margin.left - margin.right,
    height = GraphConfig.height / 2 - margin.top - margin.bottom,
    focusHeight = 100;

  let chart = (function () {
    let x = d3.scaleUtc()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right])

    let y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([height - margin.bottom, margin.top])

    let xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

    let yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y))

    const svg = d3.select(elementId)
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);

    function area(x, y) {
      return d3.area()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.value));
    }

    let path = svg.append("path")
      .datum(data)
      .attr("fill", "#cce5df")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1.5)
      .attr("d", area(x, y));

    let gx = svg.append("g")
      .call(xAxis);

    let gy = svg.append("g")
      .call(yAxis);

    return Object.assign(svg.node(), {
      update(focusX, focusY) {
        gx.call(xAxis, focusX, height);
        gy.call(yAxis, focusY, width);
        path.attr("d", area(focusX, focusY));
      }
    })
  })();

  let x = d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right])

  let y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height - margin.bottom, margin.top])

  let focus = (function () {
    let xAxis = (g) => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

    let yAxis = (g, title) => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".title").data([title]).join("text")
        .attr("class", "title")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(title))

    let area = (x, y) => d3.area()
      .defined(d => !isNaN(d.value))
      .x(d => x(d.date))
      .y0(y(0))
      .y1(d => y(d.value))

    const svg = d3.select(elementId)
      .append("svg")
      .attr("viewBox", [0, 0, width, focusHeight])
      .style("display", "block");

    const brush = d3.brushX()
      .extent([[margin.left, 0.5], [width - margin.right, focusHeight - margin.bottom + 0.5]])
      .on("brush", brushed)
      .on("end", brushended);

    const defaultSelection = [x(d3.utcYear.offset(x.domain()[1], -1)), x.range()[1]];

    svg.append("g")
      .call(xAxis, x, focusHeight);

    svg.append("path")
      .datum(data)
      .attr("fill", "#cce5df")
      .attr("d", area(x, y.copy().range([focusHeight - margin.bottom, 4])));

    const gb = svg.append("g")
      .call(brush)
      .call(brush.move, defaultSelection);

    function brushed({selection}) {
      if (selection) {
        svg.property("value", selection.map(x.invert, x).map(d3.utcDay.round));
        svg.dispatch("input");
      }
    }

    function brushended({selection}) {
      if (!selection) {
        gb.call(brush.move, defaultSelection);
      }
    }

    return svg.node();
  })();

  let svg = d3.select(focus);
  svg.on("input", function (event) {
    let domain = svg.property("value");
    const [minX, maxX] = domain;
    const maxY = d3.max(data, d => minX <= d.date && d.date <= maxX ? d.value : NaN);
    console.log(minX, maxX, maxY);
    chart.update(x.copy().domain(domain), y.copy().domain([0, maxY]));
  })
}
