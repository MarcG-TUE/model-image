import { Config } from "../config/config";
import { SvgCanvas } from "../svg/svg-support";
import { DOMMimeTypeImageSvg, DomParse } from "../utils/dom";

export const clipArtFile = (f: string)=> `../clipart/${f}`


export function addClipArt(svg: SvgCanvas, o: any) {
    switch (o.id) {
        case 'from-file':
            addFromFile(svg, o.filename)
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