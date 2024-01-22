import * as d3 from "d3"

export function addBarChart(svg: any, yDom: number, origin:[number,number], scale: number,width: number, axisLabels: any, tickValuesY: number[]|null, data: any[], fontSize?: number) {

    const height = yDom * scale
    const xScale = d3.scaleBand().range([0, width]).padding(0.4)
    const yScale = d3.scaleLinear().range([height, 0]);

    if (! fontSize) {
        fontSize = 1
    }

    var g = svg.append("g")
        .attr("transform", "translate(" + origin[0] + "," + (origin[1]) + ")");

    xScale.domain(data.map(function (d: any) { return d.label; }));
    // yScale.domain([0, d3.max(data, function (d: any) { return d.value; })]);

    yScale.domain([0,yDom]);

    g.append("g")
        .attr("transform", "translate(0,0)")
        .call(d3.axisBottom(xScale).tickSize(6*fontSize))
        .attr("font-size", 10*fontSize)
        .append("text")
        .attr("y", 0)
        .attr("dy",'2.8em')
        .attr("x", width)
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .text(axisLabels.x);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(function (d) {
        return d.toString()
    })
        .tickSize(6*fontSize)

    if (tickValuesY) {
        yAxis.tickValues(tickValuesY)
    }

    g.append("g")
        .attr("transform", `translate(0,${-height})`)
        .call(yAxis)
        .attr("font-size", 10*fontSize)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "-3.2em")
        .attr("x", 0)
        .attr("dx", "-1em")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", 10*fontSize)
        .text(axisLabels.y);

    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("transform", `translate(0,${-height})`)
        .attr("class", "bar")
        .attr("x", function (d: any) { return xScale(d.label); })
        .attr("y", function (d: any) { return yScale(d.value); })
        .attr("width", xScale.bandwidth())
        .attr("height", function (d: any) { return height - yScale(d.value); })
        .attr("fill", "#99CC00")
        .attr("stroke-width", "1")
        .attr("stroke", "#000000")

}