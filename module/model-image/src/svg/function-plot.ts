import * as d3 from "d3"
import { setPropertyIfNotExists } from "../utils/utils"
import { ColorPalette } from "../config/colors"

var UniqueCounter = 0


/**
 *
 * @param svg SvgCanvas
 * @param width
 * @param height
 * @param xDom: [number,number]
 * @param yDom: [number,number]
 * @param origin: [number,number]
 * @param options options containing
 * @param f function to plot
 */

export type TFunction = (x: number) => number
type TScatter = [number,number][]

export function addPlot(svg: any,
    width: number,
    height: number,
    origin: [number, number],
    xDom: [number, number],
    yDom: [number, number],
    options: any,
    fs: TFunction | TFunction[],
    dfs: TScatter | TScatter[]
    ): any[] {

    UniqueCounter = UniqueCounter + 1

    setPropertyIfNotExists(options, "color", ColorPalette[0])
    setPropertyIfNotExists(options, "colors", [options.color])
    setPropertyIfNotExists(options, "attributes", [{}])
    if (! Array.isArray(options.attributes)){
        options.attributes = [options.attributes]
    }
    setPropertyIfNotExists(options, "numberOfSamples", 250)
    setPropertyIfNotExists(options, "stroke-width", 2)
    setPropertyIfNotExists(options, "fill", "none")
    setPropertyIfNotExists(options, "axisType", "1Q")
    setPropertyIfNotExists(options, "showBackground", true)
    setPropertyIfNotExists(options, "clip", false)
    setPropertyIfNotExists(options, "fontSize", 10)
    setPropertyIfNotExists(options, "scatterRadius", 2.5)

    const components: any[] = []

    if (!Array.isArray(fs)) {
        fs = [fs]
    }

    const topLeft = [
        origin[0] + width * (xDom[0] / (xDom[1] - xDom[0])),
        origin[1] - height * (yDom[1] / (yDom[1] - yDom[0]))
    ]

    // chart area background
    if (options.showBackground) {
        components.push((
            svg
                .append("rect")
                .attr("x", topLeft[0])
                .attr("y", topLeft[1])
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "white")
        ).node())
    }

    // Add Axes

    let xScale = d3.scaleLinear(xDom, [topLeft[0], topLeft[0] + width])
    let yScale = d3.scaleLinear(yDom, [topLeft[1] + height, topLeft[1]])

    const xAxis = d3.axisBottom(xScale)
        .tickSizeOuter(0)

    if (options.tickValuesX) {
        xAxis.tickValues(options.tickValuesX)
    }

    if (options.tickFormatX) {
        xAxis.tickFormat(d3.format(options.tickFormatX))
    }

    let yAxis = d3.axisLeft(yScale)
        .tickSizeOuter(0)
    if (options.tickValuesY) {
        yAxis.tickValues(options.tickValuesY)
    }
    if (options.tickFormatY) {
        yAxis.tickFormat(d3.format(options.tickFormatY))
    }

    switch (options.axisType) {
        case "1Q":
            components.push((
                svg.append("g")
                    .attr("transform", `translate(0,${topLeft[1] + height})`)
                    .style("font", options.fontSize.toString())
                    .call(xAxis)
            ).node())
            components.push((
                svg.append("g")
                    .attr("transform", `translate(${topLeft[0]},0)`)
                    .style("font", options.fontSize.toString())
                    .call(yAxis)
            ).node())
            break

        case "4Q":
            components.push((
                svg.append("g")
                    .attr("transform", `translate(0,${origin[1]})`)
                    .call(xAxis)
                    .attr("font-size", options.fontSize.toString())
            ).node())
            components.push((
                svg.append("g")
                    .attr("transform", `translate(${origin[0]},0)`)
                    .style("font", options.fontSize.toString())
                    .call(yAxis)
            ).node())
            break

        default:
            throw new Error(`Unknown axis type: ${options.axisType}`)
    }


    function graphFunction(f: TFunction) {
        const data = []
        var x = xDom[0]
        const step = (xDom[1] - xDom[0]) / (options.numberOfSamples - 1)
        for (let n = 0; n < options.numberOfSamples; n++) {
            const y = f(x)
            data.push([x, y])
            x += step
        }
        return data
    }

    var clip: any
    if (options.clip) {
        clip = svg.append("svg:clipPath")
            .attr("id", `clip${UniqueCounter}`)
            .append("svg:rect")
            .attr("id", "clip-rect")
            .attr("x", topLeft[0])
            .attr("y", topLeft[1])
            .attr("width", width)
            .attr("height", height)
        components.push(clip.node())
    }

    // Add function graphs
    fs.forEach((f, i) => {
        let line: d3.Line<[number, number]> = d3.line()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
        var color = (options.colors) ? options.colors[i] : ColorPalette[i]
        if (color === undefined) {
            color = ColorPalette[i % ColorPalette.length]
        }
        var attrs = (options.attributes) ? options.attributes[i % options.attributes.length] : {}
        const p = svg.append("path")
            .datum(graphFunction(f))
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", options["stroke-width"])
            .attr("d", line)
        if (options.clip) {
            p.attr("clip-path", `url(#clip${UniqueCounter})`)
        }
        for (const [key, value] of Object.entries(attrs)) {
            p.attr(key, value)
        }
        components.push(p.node())
    })

    // Add scatter plots
    dfs.forEach((s, i) => {
        const color = (options.scatterColors) ? options.scatterColors[i] : ColorPalette[i+1]
        // Add dots
        components.push((
            svg.append('g')
                .selectAll("dot")
                .data(s)
                .enter()
                .append("circle")
                .attr("cx", function (d: [number,number]) { return xScale(d[0]) } )
                .attr("cy", function (d: [number,number]) { return yScale(d[1])} )
                .attr("r", options.scatterRadius)
                .style("fill", color)
        ).node())
    })

    return components
}

export function addPlotPolar(svg: any,
    width: number,
    height: number,
    origin: [number, number],
    phiDom: [number, number],
    rMax: number,
    scale: number,
    options: any,
    f: (alpha: number) => number): any[] {

    // set default values
    setPropertyIfNotExists(options, "color", "#0000aa")
    setPropertyIfNotExists(options, "numberOfSamples", 250)
    setPropertyIfNotExists(options, "stroke-width", 2)
    setPropertyIfNotExists(options, "fill", "none")
    setPropertyIfNotExists(options, "fill-opacity", 0.5)
    setPropertyIfNotExists(options, "showBackground", true)
    setPropertyIfNotExists(options, "showAngles", true)
    setPropertyIfNotExists(options, "fontSize", "12px")

    const components: any[] = []

    const topLeft = [
        origin[0] - width * 0.5,
        origin[1] - height * 0.5
    ]

    // chart area background
    if (options.showBackground) {
        components.push((
            svg
                .append("rect")
                .attr("x", topLeft[0])
                .attr("y", topLeft[1])
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "white")
        ).node())
    }

    // Add Axes
    const xDom = [-rMax, rMax]
    let xScale = d3.scaleLinear(xDom, [-scale * rMax, scale * rMax])
    const yDom = [-rMax, rMax]
    let yScale = d3.scaleLinear(yDom, [scale * rMax, -scale * rMax])


    function graphFunction() {
        const data = []
        var alpha = phiDom[0]
        const step = (phiDom[1]-phiDom[0]) / (options.numberOfSamples - 1)
        for (let n = 0; n < options.numberOfSamples; n++) {
            const r = f(alpha)
            const p: [number, number] = [r * Math.cos(alpha), r * Math.sin(alpha)]
            data.push(p)
            alpha += step
        }
        return data
    }

    const radius = rMax*scale
    var rScale = d3.scaleLinear()
        .domain([0, rMax])
        .range([0, rMax*scale])

    const go = svg.append("g")
        .attr("transform", "translate(" + origin[0] + "," + origin[1] + ")")
        .style("font-size", options.fontSize)
    components.push(go.node())

    const rTicks = options.tickValuesR ? options.tickValuesR : rScale.ticks(5).slice(1)

    // for each r-tick
    const grt = go.append("g")
        .attr("class", "r axis")
        .selectAll("g")
        .data(rTicks)
        .enter().append("g")

    // dashed circles
    grt.append("circle")
        .attr("r", rScale)
        .attr("fill", "none")
        .attr("stroke", "#777")
        .attr("stroke-dasharray", "1,4")

    grt.append("text")
        .attr("y", function (d: any) { return -rScale(d) - 4 })
        .attr("x", 0)
        .attr("transform", "rotate(15)")
        .style("text-anchor", "middle")
        .text(function (d: any) { return d })

    // for all angles
    const ga = go.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 30))
        .enter().append("g")
        .attr("transform", function (d: any) { return "rotate(" + -d + ")" })

    ga.append("line")
        .attr("x2", rMax*scale)
        .attr("stroke", "#777")
        .attr("stroke-dasharray", "1,4")

    if (options.showAngles) {
        ga.append("text")
            .attr("x", radius + 6)
            .attr("dy", ".35em")
            .style("text-anchor", function (d: any) { return d < 270 && d > 90 ? "end" : null })
            .attr("transform", function (d: any) { return d < 270 && d > 90 ? "rotate(180 " + (radius + 6) + ",0)" : null })
            .text(function (d: any) { return d + "°" })
    }

    // Add function graph
    let line: d3.Line<[number, number]> = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
    go.append("path")
        .datum(graphFunction())
        .attr("fill", options.fill)
        .attr("fill-opacity", options["fill-opacity"])
        .attr("stroke", options.color)
        .attr("stroke-width", options["stroke-width"])
        .attr("d", line)

    return components

}
