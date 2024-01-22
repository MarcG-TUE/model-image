import * as d3 from "d3"
import { Point, Points, normalize, scalePoint, subPoint, rotatePoint, addPoint, shortenStart, shortenEnd } from "../math/geometry"
import { getMathjaxSvg } from "../math/mathjax"
import { addBarChart } from "./charts"
import { TFunction, addPlot, addPlotPolar } from "./function-plot"
import { arrayBufferToBase64, loadBitmap, setPropertyIfNotExists } from "../utils/utils"
import { pngData } from "../utils/png"
import { DomParse, QuerySelector } from "../utils/dom"
import { Config } from "../config/config"

const MathJaxScaleCorrection = 0.7

// export type Attribute = [string, string]
// export type Attributes = Attribute[]

export class SvgCanvas {

    _parentNode: any
    width: number = 0
    height: number = 0
    svgCanvas: any
    currentCanvas: any
    canvasStack: any[]

    /**
     * Create a canvas of size width, height in pixels.
     * For print, a px should be equal to 1/96th of an inch.
     */

    constructor(innerHeight: number, innerWidth: number, outerHeight: number, outerWidth: number, parentNode: any) {

        if(parentNode === undefined || parentNode === null) {
            // const dom = asDOM(`<!DOCTYPE html><body></body>`)

            // this._parentNode = d3.select(dom.window.document.querySelector("body"))
            const doc = DomParse("<!DOCTYPE html><body></body")
            this._parentNode = d3.select(QuerySelector(doc, "body"))
        } else {
            this._parentNode = d3.select(parentNode)
        }

        this.width = innerWidth
        this.height = innerHeight
        this.svgCanvas = this._parentNode.append('svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight)
            .attr('viewBox', `0 0 ${innerWidth} ${innerHeight}`)
            .attr('xmlns', 'http://www.w3.org/2000/svg')
        // const gNode = this.svgCanvas.append('g')
        //     .attr("transform", "scale(1)")
        this.currentCanvas = this.svgCanvas
        this.canvasStack = [this.currentCanvas]
    }

    pushCanvas(c: any) {
        this.canvasStack.push(c)
        this.currentCanvas = c
    }

    popCanvas() {
        this.canvasStack.pop()
        this.currentCanvas = this.canvasStack[this.canvasStack.length - 1]
    }

    getSvgText(): string {
        // console.log(this.currentCanvas.node().html())
        return this._parentNode.html()
    }

    appendAttributes(node: any, attr: any) {
        if (attr) {
            for (const [key, value] of Object.entries(attr)) {
                if (typeof value === 'string') {
                    node.attr(key, value)
                } else {
                    node.attr(key, `${value}`)
                }
            }
        }
    }

    addRectangle(topLeft: Point, size: Point, attr: any, parent?: any): SVGRectElement {
        var p = this.selectParent(parent)
        if (!attr) {
            attr = {
                "stroke": "#000000",
                "stroke-width": 1.0
            }
        }

        // if (p.node === undefined) {
        //     p = d3.select(p)
        // }


        var nd = p.append("rect")
            .attr("x", topLeft[0])
            .attr("y", topLeft[1])
            .attr("width", size[0])
            .attr("height", size[1])
        this.appendAttributes(nd, attr)
        return nd.node() as SVGRectElement
    }

    ensureD3Selection(n: any): d3.Selection<any, unknown, null, undefined> {
        // hack to normalize d3 selection of raw nod into a selection
        if (n.selectAll === undefined) {
            return d3.select(n)
        }
        return n
    }


    selectParent(parent: any) {
        if (parent===undefined) {
            return this.ensureD3Selection(this.currentCanvas)
        }
        return this.ensureD3Selection(parent)
    }

    addCircle(center: Point, radius: number, attr: any, parent?: any) {
        const p = this.selectParent(parent)
        var nd = p.append("circle")
            .attr("cx", center[0])
            .attr("cy", center[1])
            .attr("r", radius)
        this.appendAttributes(nd, attr)
        return nd.node()
    }


    includeMarkers(beginMarker: boolean, endMarker: boolean, attr: any) {
        if (beginMarker || endMarker) {
            const startMarkerName = "LineStartMarker_" + attr.stroke.replace('#', '')
            const endMarkerName = "LineEndMarker_" + attr.stroke.replace('#', '')
            if (beginMarker) {
                this.addStartMarkerArrowheadSolid(startMarkerName, attr.stroke)
                attr['marker-start'] = "url(#" + startMarkerName + ")"
            }
            if (endMarker) {
                this.addEndMarkerArrowheadSolid(endMarkerName, attr.stroke)
                attr['marker-end'] = "url(#" + endMarkerName + ")"
            }
        }
    }

    addArc(center: Point, radius: number, startAngle: number, endAngle: number, attr: any, beginMarker: boolean = false, endMarker: boolean = false, parent?: any): any {
        const p = this.selectParent(parent)

        attr = JSON.parse(JSON.stringify(attr))

        setPropertyIfNotExists(attr, "stroke-width", 1)
        this.includeMarkers(beginMarker, endMarker, attr)
        if (beginMarker) {
            startAngle += 2*attr["stroke-width"]/radius
        }
        if (endMarker) {
            endAngle -= 2*attr["stroke-width"]/radius
        }
        const startP = addPoint(center, scalePoint([Math.cos(startAngle), -Math.sin(startAngle)], radius))
        const endP = addPoint(center, scalePoint([Math.cos(endAngle), -Math.sin(endAngle)], radius))
        var largeSweep = (endAngle-startAngle)>Math.PI?1:0
        var nd = p.append("path")
            .attr("d", `M ${startP[0].toFixed(3)} ${startP[1].toFixed(3)} A ${radius} ${radius} 0 ${largeSweep} 0 ${endP[0].toFixed(3)} ${endP[1].toFixed(3)}`)
        this.appendAttributes(nd, attr)
        return nd.node()
    }

    addEllipse(center: Point, radiusMajor: number, radiusMinor: number, rotation: number, attr: any, parent?: any) {
        const p = this.selectParent(parent)
        var nd = p.append("ellipse")
            .attr("cx", center[0])
            .attr("cy", center[1])
            .attr("rx", radiusMajor)
            .attr("ry", radiusMinor)
            .attr("transform", `rotate(${-rotation} ${center[0]} ${center[1]})`)
        this.appendAttributes(nd, attr)
        return nd.node()
    }

    addLine(p1: Point, p2: Point, attr: any, beginMarker: boolean = false, endMarker: boolean = false, parent?: any) {
        setPropertyIfNotExists(attr, "stroke", "#000000")
        setPropertyIfNotExists(attr, "stroke-width", 1)

        const p = this.selectParent(parent)

        this.includeMarkers(beginMarker, endMarker, attr)

        if (beginMarker) {
            p1 = shortenStart(p1, p2, 2*attr["stroke-width"])
        }
        if (endMarker) {
            p2 = shortenEnd(p1, p2, 2*attr["stroke-width"])
        }
        var nd = p
            // .append("svg:a")
            // .attr("xlink:href", "https://computationalmodeling.info")
            .append("line")
            .attr("x1", p1[0])
            .attr("y1", p1[1])
            .attr("x2", p2[0])
            .attr("y2", p2[1])
        this.appendAttributes(nd, attr)
        return nd.node()
    }

    addPath(pathString: string, attr: any, beginMarker: boolean = false, endMarker: boolean = false) {
        setPropertyIfNotExists(attr, "stroke", "#000000")
        setPropertyIfNotExists(attr, "stroke-width", 1)
        this.includeMarkers(beginMarker, endMarker, attr)

        var nd = this.currentCanvas
            .append("path")
            .attr("d", pathString)
        this.appendAttributes(nd, attr)
    }


    addText(t: string, position: Point, size?: number, attr?: any) {
        if (!size) {
            size = 1
        }
        var nd = this.currentCanvas.append("text")
            .attr("x", position[0])
            .attr("y", position[1])
            .attr("font-size", size * 10)
            .attr("font-family", "Arial")
            .text(decodeURIComponent(t))
        this.appendAttributes(nd, attr)
    }

    addPolyline(points: Points, attr: any, beginMarker: boolean = false, endMarker: boolean = false, parent?: any): any {
        setPropertyIfNotExists(attr, "stroke-width", 1)
        this.includeMarkers(beginMarker, endMarker, attr)

        if (beginMarker) {
            points[0] = shortenStart(points[0], points[1], 2*attr["stroke-width"])
        }
        if (endMarker) {
            points[points.length-1] = shortenEnd(points[points.length-2], points[points.length-1], 2*attr["stroke-width"])
        }

        const p = this.selectParent(parent)

        var nd = p.append("polyline")
            .attr("points", strPoints(points))
        this.appendAttributes(nd, attr)
        return nd.node()
    }

    addPolygon(points: Points, attr: any) {
        var nd = this.currentCanvas.append("polygon")
            .attr("points", strPoints(points))
        this.appendAttributes(nd, attr)
        return nd.node()
    }

    addGrid() {
        var x = 0
        while (x <= this.width) {
            this.addLine([x, 0], [x, this.height], {
                "stroke": ((x%100===0)?"#ffaaaa":"#aaaaaa"),
                "stroke-width": ((x%100===0)?2:1)
            })
            x += 25
        }
        var y = 0
        while (y <= this.height) {
            this.addLine([0, y], [this.width, y], {
                "stroke": ((y%100===0)?"#ffaaaa":"#aaaaaa"),
                "stroke-width": ((y%100===0)?2:1)
            })
            y += 25
        }
    }

    addFatArrow(def: any) {
        setPropertyIfNotExists(def, "attributes", {})
        setPropertyIfNotExists(def.attributes, "stroke", "#000000")
        setPropertyIfNotExists(def.attributes, "stroke-width", 1.0)

        const dir = subPoint(def.end, def.start)
        const nDir = normalize(dir)
        const nDirOrth = rotatePoint(nDir, 90)

        const hl = def['head-length']
        const w = def.width
        const hw = def['head-width']

        // startR = start - w/2 * nDirOrth
        const p1 = subPoint(def.start, scalePoint(nDirOrth, w / 2))
        // underTipInnerR = end - hl * nDir - w/2 * nDirOrth
        const p2 = subPoint(subPoint(def.end, scalePoint(nDir, hl)), scalePoint(nDirOrth, w / 2))
        // underTipOuterR = end - hl * nDir - hw/2 * nDirOrth
        const p3 = subPoint(subPoint(def.end, scalePoint(nDir, hl)), scalePoint(nDirOrth, hw / 2))
        // endtip = end
        const p4 = def.end
        // underTipOuterL = end - hl * nDir + hw/2 * nDirOrth
        const p5 = addPoint(subPoint(def.end, scalePoint(nDir, hl)), scalePoint(nDirOrth, hw / 2))
        // underTipInnerL = end - hl * nDir + w/2 * nDirOrth
        const p6 = addPoint(subPoint(def.end, scalePoint(nDir, hl)), scalePoint(nDirOrth, w / 2))
        // startL = start + w/2 * nDirOrth
        const p7 = addPoint(def.start, scalePoint(nDirOrth, w / 2))

        this.addPolygon([p1, p2, p3, p4, p5, p6, p7], def.attributes)
    }

    addSvg(subSvg: SVGElement, position?: Point, scale?: number, rotation?: [number, number, number], targetNode?: any): any {

        const pNode = this.selectParent(targetNode)

        const gNode = pNode.append("g")
        var transform: string = ""
        if (position!==undefined || scale!==undefined || rotation!==undefined) {
            if (position) {
                transform = `translate(${position[0]},${position[1]})`
            }
            if (scale) {
                transform += `scale(${scale})`
            }
            if (! (rotation===undefined)) {
                if (! (rotation[0]===undefined || rotation[1]===undefined || rotation[2]===undefined)) {
                transform += `rotate(${rotation[0]},${rotation[1]},${rotation[2]})`
                }
            }
            gNode.attr("transform", transform)
        }

        gNode.node()?.appendChild(subSvg)
        return gNode.node()
    }

    markerDefinitions: string[] = []

    addEndMarkerArrowheadSolid(name: string, color: string = "#000000") {
        if (!this.markerDefinitions.includes(name)) {
            this.markerDefinitions.push(name)
            this.currentCanvas.append("defs")
                .append("marker")
                .attr("id", name)
                .attr("viewBox", "0 -2.5 5 5")
                .attr("refX", "3")
                .attr("refY", "0")
                .attr("markerUnits", "strokeWidth")
                .attr("markerWidth", "5")
                .attr("markerHeight", "5")
                .attr("orient", "auto")
                .attr("fill", color)
                .append("path")
                .attr("d", "M0,-2.5L5,0L0,2.5")
        }
    }

    addStartMarkerArrowheadSolid(name: string, color: string = "#000000") {
        if (!this.markerDefinitions.includes(name)) {
            this.markerDefinitions.push(name)
            this.currentCanvas.append("defs")
                .append("marker")
                .attr("id", name)
                .attr("viewBox", "0 -2.5 5 5")
                .attr("refX", "2")
                .attr("refY", "0")
                .attr("markerUnits", "strokeWidth")
                .attr("markerWidth", "5")
                .attr("markerHeight", "5")
                .attr("orient", "auto")
                .attr("fill", color)
                .append("path")
                .attr("d", "M5,-2.5L0,0L5,2.5")
        }
    }


    addMarkerArrowheadOpenCurved(name: string, color: string = "#000000") {
        if (!this.markerDefinitions.includes(name)) {
            this.markerDefinitions.push(name)
            this.currentCanvas.append("defs")
                .append("marker")
                .attr("id", name)
                .attr("viewBox", "0 -3 6 6")
                .attr("refX", "5.5")
                .attr("refY", "0")
                .attr("markerWidth", "6")
                .attr("markerHeight", "6")
                .attr("orient", "auto")
                .attr("stroke", color)
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .attr("fill", "none")
                .append("path")
                .attr("d", "M0.5,-2.5C2.0,-1.0 4.0,0 5.5,0C4.0,0 2.0,1.0 0.5,2.5")
        }
    }

    // markerArrowHead2Added: boolean = false
    // addMarkerArrowhead2(color: string = "#000000") {
    //     if (!this.markerArrowHead2Added) {
    //         this.markerArrowHead2Added = true
    //         this.currentCanvas.append("defs")
    //             .append("marker")
    //             .attr("id", "arrow")
    //             .attr("viewBox", "0 -7.5 15 15")
    //             .attr("refX", "15")
    //             .attr("refY", "0")
    //             .attr("markerWidth", "6")
    //             .attr("markerHeight", "6")
    //             .attr("orient", "auto")
    //             .attr("fill", color)
    //             .append("path")
    //             .attr("d", "M0,-7.5L15,0L0,7.5")
    //     }
    // }

    addLaTeX(formula: string, position: Point, scale: number, color: string = "#000000", parent?: any) {
        const doc = getMathjaxSvg(formula, s => s.replace(/currentColor/g, color))
        const svgElement: HTMLOrSVGElement = doc.documentElement
        if (scale) {
            scale *= MathJaxScaleCorrection
        } else {
            scale = MathJaxScaleCorrection
        }


        return this.addSvg(svgElement as SVGElement, position, scale, parent, parent)
    }

    addImage(svgDoc: any, position?: Point, scale?: number, rotation?: [number, number, number], targetNode?: any) {

        const svgElement = svgDoc.documentElement
        this.addSvg(svgElement, position, scale, rotation, targetNode)
    }

    addBitmap(data: number[][][], position: [number, number], scale: number) {
        const {encodedImage, height, width} = pngData(data)
        this.currentCanvas.append("svg:image")
            .attr('x', position[0])
            .attr('y', position[1])
            .attr('width', scale*width)
            .attr('height', scale*height)
            .attr("xlink:href", `data:image/png;base64,${encodedImage}`)
    }

    addBitmapFromFile(filename: string, position: [number, number], width: number, height: number) {
        const content = loadBitmap(filename)
        const encodedImage = arrayBufferToBase64(content)
        this.currentCanvas.append("svg:image")
            .attr('x', position[0])
            .attr('y', position[1])
            .attr('width', width)
            .attr('height', height)
            .attr("xlink:href", `data:image/png;base64,${encodedImage}`)
    }

    addBarChart(yDom: number, origin: [number, number], scale: number, width: number, axisLabels: any, tickValuesY: number[], data: any[], fontSize?: number) {
        this.addRectangle([origin[0], origin[1] - yDom * scale], [width, yDom * scale], {
            fill: "#ffffff"
        })
        addBarChart(this, yDom, origin, scale, width, axisLabels, tickValuesY, data, fontSize)
    }

    addFunctionPlot(fp: any, parentNode?: any): any[] {
        setPropertyIfNotExists(fp, "options", {})
        setPropertyIfNotExists(fp.options, "color", "#0000aa")
        setPropertyIfNotExists(fp.options, "colors", [fp.options.color])
        setPropertyIfNotExists(fp.options, "attributes", [{}])
        setPropertyIfNotExists(fp.options, "fontSize", 10)
        setPropertyIfNotExists(fp, "functions", [fp.function])
        setPropertyIfNotExists(fp, "scatters", fp.scatter?[fp.scatter]:[])
        if (parentNode) {
            return addPlot(d3.select(parentNode), fp.width, fp.height, fp.origin, fp.xDom, fp.yDom, fp.options, fp.functions,fp.scatters)
        } else {
            return addPlot(this.currentCanvas, fp.width, fp.height, fp.origin, fp.xDom, fp.yDom, fp.options, fp.functions,fp.scatters)
        }
    }

    append(n: string): any {
        return this.currentCanvas.append(n)
    }

    startSubFigure(tr: string, hyperlink: string|null = null) {
        const gNode = this.currentCanvas.append("g")
        gNode.attr("transform", tr)
        if (hyperlink) {
            const aNode = gNode.append("svg:a")
            aNode.attr("xlink:href", hyperlink)
            this.pushCanvas(aNode)
        } else {
            this.pushCanvas(gNode)
        }
        return gNode
    }

    endSubFigure() {
        this.popCanvas()
    }

    removeElement(node: any)  {
        const parentNode = node.parentNode
        node.parentNode?.removeChild(node)
        return parentNode
    }

    removeElements(nodes: any[])  {
        var parentNode: any
        nodes.forEach(n=>{
            parentNode = this.removeElement(n)
        })
        return parentNode
    }

    addPlot(width: number,
        height: number,
        origin: [number, number],
        xDom: [number, number],
        yDom: [number, number],
        options: any,
        fs: TFunction|TFunction[],
        parentNode?: any): any[] {
            if (parentNode) {
                return addPlot(d3.select(parentNode), width, height, origin, xDom, yDom, options, fs,[])
            } else {
                return addPlot(this.currentCanvas, width, height, origin, xDom, yDom, options, fs,[])
            }
        }

    addPlotPolar(width: number,
        height: number,
        origin: [number, number],
        phiDom: [number, number],
        rMax: number,
        scale: number,
        options: any,
        f: (alpha: number) => number,
        parentNode?: any): any[] {
            if (parentNode) {
                return addPlotPolar(d3.select(parentNode), width, height, origin, phiDom, rMax, scale, options, f)
            } else {
                return addPlotPolar(this.currentCanvas, width, height, origin, phiDom, rMax, scale, options, f)
            }

        }

}


export function strPoint(p: Point): string {
    return `${p[0]},${p[1]}`
}

export function strPoints(points: Points): string {
    return points.reduce(
        (s, p, n) => {
            if (n === 0) {
                return s + strPoint(p)
            }
            return s + ` ${strPoint(p)}`
        }, "")
}


