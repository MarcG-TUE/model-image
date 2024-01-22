import * as d3 from "d3"
import { Point, PointTransform, addPoint } from "../math/geometry"
import { SvgCanvas } from "../svg/svg-support"
import { setPropertyIfNotExists } from "../utils/utils"
import * as LA from 'ml-matrix';
import * as BBL from "babylonjs"
import { SceneBuilder3D } from "../babylon/support";

export type Vector = [Point, Point]

/**
 * make 1 quadrant axes. Assumes x and y range from a non-negative to a positive number
 * @param svg
 * @param xDom
 * @param xRange
 * @param yDom
 * @param yRange
 * @returns
 */
export function axes2D1Q(
    svg: SvgCanvas,
    xDom: [number, number],
    xRange: [number, number],
    yDom: [number, number],
    yRange: [number, number], options: any
): PointTransform {

    setPropertyIfNotExists(options, "fontSize", 10)

    var xScale = d3.scaleLinear()
        .domain(xDom)
        .range(xRange);

    var yScale = d3.scaleLinear()
        .domain(yDom)
        .range(yRange);


    var xTicks: number[] = []
    if (options.tickValuesX) {
        xTicks = options.tickValuesX
    } else {
        // make integer ticks excluding 0
        var xt = Math.ceil(xDom[0])
        while (xt <= xDom[1]) {
            if (xt !== 0) {
                xTicks.push(xt)
            }
            xt += 1
        }
    }


    var yTicks: number[] = []
    if (options.tickValuesY) {
        yTicks = options.tickValuesY
    } else {
        var yt = Math.ceil(yDom[0])
        while (yt <= yDom[1]) {
            if (yt !== 0) {
                yTicks.push(yt)
            }
            yt += 1
        }
    }

    var x_axis = d3.axisBottom(xScale)
        .tickSizeOuter(0)
        .tickValues(xTicks)
        .tickFormat(d3.format(".0f"))

    var y_axis = d3.axisLeft(yScale)
        .tickSizeOuter(0)
        .tickValues(yTicks)
        .tickFormat(d3.format(".0f"))


    // determine the origin position
    const width = xRange[1]-xRange[0]
    const height = yRange[0]-yRange[1]
    const xOrigin = xRange[0] + width/(xDom[1]-xDom[0]) * (0-xDom[0])
    const yOrigin = yRange[1] + height/(yDom[1]-yDom[0]) * yDom[1]
    const xScaling = (xRange[1] - xRange[0]) / (xDom[1] - xDom[0])
    const yScaling = (yRange[1] - yRange[0]) / (yDom[1] - yDom[0])

    svg.append("g")
        .attr("transform", `translate(${xOrigin}, 0)`)
        .call(y_axis);

    svg.append("g")
        .attr("transform", `translate(0, ${yOrigin})`)
        .call(x_axis)

    return p => [p[0] * xScaling + xOrigin, p[1] * yScaling + yOrigin]

}


/**
 * make 4 quadrant axes. Assumes x and y range from a negative to a positive number
 * @param svg
 * @param xDom
 * @param xRange
 * @param yDom
 * @param yRange
 * @returns
 */
export function axes2D4Q(
    svg: SvgCanvas,
    xDom: [number, number],
    xRange: [number, number],
    yDom: [number, number],
    yRange: [number, number], options: any
): PointTransform {

    setPropertyIfNotExists(options, "tickFormatX", ".0f")
    setPropertyIfNotExists(options, "tickFormatY", ".0f")

    var xScale = d3.scaleLinear()
        .domain(xDom)
        .range(xRange);

    var yScale = d3.scaleLinear()
        .domain(yDom)
        .range(yRange);


    var xTicks: number[] = []
    if (options.tickValuesX) {
        xTicks = options.tickValuesX
    } else {
        // make integer ticks excluding 0
        var xt = Math.ceil(xDom[0])
        while (xt <= xDom[1]) {
            if (xt !== 0) {
                xTicks.push(xt)
            }
            xt += 1
        }
    }


    var yTicks: number[] = []
    if (options.tickValuesY) {
        yTicks = options.tickValuesY
    } else {
        var yt = Math.ceil(yDom[0])
        while (yt <= yDom[1]) {
            if (yt !== 0) {
                yTicks.push(yt)
            }
            yt += 1
        }
    }

    const fx = options.tickFormatX==="" ? ()=>'' : d3.format(options.tickFormatX)
    const fy = options.tickFormatY==="" ? ()=>'' : d3.format(options.tickFormatY)

    var x_axis = d3.axisBottom(xScale)
        .tickSizeOuter(0)
        .tickValues(xTicks)
        .tickFormat(fx)

    var y_axis = d3.axisLeft(yScale)
        .tickSizeOuter(0)
        .tickValues(yTicks)
        .tickFormat(fy)


    // determine the origin position
    const width = xRange[1]-xRange[0]
    const height = yRange[0]-yRange[1]
    const xOrigin = xRange[0] + width/(xDom[1]-xDom[0]) * (0-xDom[0])
    const yOrigin = yRange[1] + height/(yDom[1]-yDom[0]) * yDom[1]
    const xScaling = (xRange[1] - xRange[0]) / (xDom[1] - xDom[0])
    const yScaling = (yRange[1] - yRange[0]) / (yDom[1] - yDom[0])

    svg.append("g")
        .attr("transform", `translate(${xOrigin}, 0)`)
        .call(y_axis);

    svg.append("g")
        .attr("transform", `translate(0, ${yOrigin})`)
        .call(x_axis)

    return p => [p[0] * xScaling + xOrigin, p[1] * yScaling + yOrigin]

}

/**
 * make 4 quadrant axes. Assumes x and y range from a negative to a positive number
 * @param svg
 * @param xDom
 * @param xRange
 * @param yDom
 * @param yRange
 * @returns
 */
export function axes2D4QTransform(
    xDom: [number, number],
    xRange: [number, number],
    yDom: [number, number],
    yRange: [number, number]
): PointTransform {

    // determine the origin position
    const width = xRange[1]-xRange[0]
    const height = yRange[0]-yRange[1]
    const xOrigin = xRange[0] + width/(xDom[1]-xDom[0]) * (0-xDom[0])
    const yOrigin = yRange[1] + height/(yDom[1]-yDom[0]) * yDom[1]
    const xScaling = (xRange[1] - xRange[0]) / (xDom[1] - xDom[0])
    const yScaling = (yRange[1] - yRange[0]) / (yDom[1] - yDom[0])

    return p => [p[0] * xScaling + xOrigin, p[1] * yScaling + yOrigin]

}


export function pointToVector(p: Point, s: Point = [0, 0]): Vector {
    return [s, addPoint(s, p)]
}


export function axes3D8Q(sb: SceneBuilder3D,
    xDom: [number, number],
    yDom: [number, number],
    zDom: [number, number],
    parent?: BBL.Node
) {

    const black = BBL.Color4.FromColor3(BBL.Color3.Black())
    sb.addLine(LA.Matrix.columnVector([xDom[0], 0, 0]), LA.Matrix.columnVector([xDom[1], 0, 0]), black, false, parent)
    sb.addLine(LA.Matrix.columnVector([0, yDom[0], 0]), LA.Matrix.columnVector([0, yDom[1], 0]), black, false, parent)
    sb.addLine(LA.Matrix.columnVector([0, 0, zDom[0]]), LA.Matrix.columnVector([0, 0, zDom[1]]), black, false, parent)
}

export function axes3D1Q(sb: SceneBuilder3D,
    xDom: number,
    yDom: number,
    zDom: number,
    parent?: BBL.Node
) {

    const black = BBL.Color4.FromColor3(BBL.Color3.Black())
    sb.addLine(LA.Matrix.columnVector([0, 0, 0]), LA.Matrix.columnVector([xDom, 0, 0]), black, false, parent)
    sb.addLine(LA.Matrix.columnVector([0, 0, 0]), LA.Matrix.columnVector([0, yDom, 0]), black, false, parent)
    sb.addLine(LA.Matrix.columnVector([0, 0, 0]), LA.Matrix.columnVector([0, 0, zDom]), black, false, parent)
}