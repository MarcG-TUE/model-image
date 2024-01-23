import { Config } from "../config/config";
import { Point, Points, addPoint, offset } from "../math/geometry";
import { SvgCanvas } from "../svg/svg-support";
import { DOMMimeTypeImageSvg, DomParse } from "../utils/dom";
import { setPropertyIfNotExists } from "../utils/utils";

export const clipArtFile = (f: string)=> `../clipart/${f}`

const AntennaColor = "#ffff00"

export function addClipArt(svg: SvgCanvas, o: any) {
    switch (o.id) {
        case 'from-file':
            addFromFile(svg, o.filename)
            break;

        case 'antenna':
            addAntenna(svg, o.offset)
            break;

        case 'antenna-array':
            addAntennaArray(svg, o["number-of-antennas"], o["delta"])
            break;

            case 'delay-block':
            addDelayBlock(svg, o)
            break;

        case 'adder':
            addAdder(svg)
            break;

        case 'multiplier':
            addMultiplier(svg)
            break;

        case 'multiplier2':
            addMultiplier2(svg)
            break;

        default:
            throw new Error(`Unknown clip-art element: ${o.id}`);
    }
}

export function addFromFile(svg: SvgCanvas, filename: string) {
    if (Config.GetClipartSynchronous === undefined) {
        return addFromFileAsynchronous(svg, filename)
    }
    const svgText = Config.GetClipartSynchronous(filename)
    const node = DomParse(svgText, DOMMimeTypeImageSvg)
    svg.addImage(node)
}



export function addFromFileAsynchronous(svg: SvgCanvas, filename: string) {

    // fix target node, because of the async callback
    const targetNode = svg.currentCanvas

    if (Config.GetClipartAsynchronous === undefined) {
        console.warn("No method is specified to get clipart file.")
        return
    }

    Config.GetClipartAsynchronous(filename)
    .then(function (svgText) {
            // console.warn(text)
            const node = DomParse(svgText, DOMMimeTypeImageSvg)
            svg.addImage(node, undefined, undefined, undefined, targetNode)
        })
}

function addAntenna(svg: SvgCanvas, pos: [number,number]=[0,0]){
    const points: Points = offset([[-10,0],[10,0],[0,20]], pos)

    svg.addPolygon(points,{stroke: "#000000", fill: AntennaColor, "stroke-width":1})
    svg.addLine(addPoint(pos, [0,0]), addPoint(pos,[0,30]), {stroke: "#000000", "stroke-width":1})
}

function addAntennaArray(svg: SvgCanvas, n: number, delta: [number,number]){
    var pos:Point = [0,0]
    while (n>0) {
        addAntenna(svg, pos)
        pos = addPoint(pos, delta)
        n = n-1
    }
}

function addDelayBlock(svg: SvgCanvas, db: any){
    setPropertyIfNotExists(db, "label", "\\tau")
    setPropertyIfNotExists(db, "labelPosition", [-3,-2])
    setPropertyIfNotExists(db, "labelScale", 1)
    svg.addRectangle([-10,-10],[20,20],{
        stroke: "#000000",
        "stroke-width": 1,
        "fill": "#D0FECF"
    })
    svg.addLaTeX(db.label, db.labelPosition,db.labelScale,"#000000")
}

function addMultiplier(svg: SvgCanvas){
    svg.addPolygon([[-13,0],[13,0],[0,20]],{
        stroke: "#000000",
        "stroke-width": 1,
        "fill": "#FA9E9D"
    })
}

function addAdder(svg: SvgCanvas){
    svg.addCircle([0,0],10, {
        stroke: "#000000",
        "stroke-width": 1,
        "fill": "#9DCBFC"
    })
    svg.addLine([-6,0],[6,0],{
        stroke: "#000000",
        "stroke-width": 1,
    })
    svg.addLine([0,-6],[0,6],{
        stroke: "#000000",
        "stroke-width": 1,
    })
}

function addMultiplier2(svg: SvgCanvas){
    svg.addCircle([0,0],10, {
        stroke: "#000000",
        "stroke-width": 1,
        "fill": "#9DCBFC"
    })
    svg.addLine([-4,-4],[4,4],{
        stroke: "#000000",
        "stroke-width": 1,
    })
    svg.addLine([-4,4],[4,-4],{
        stroke: "#000000",
        "stroke-width": 1,
    })
}
