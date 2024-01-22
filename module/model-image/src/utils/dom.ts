export type TDOMConfig = {
    // JSDOM: undefined | ((text: string)=>any)
    DomParser: undefined | (()=>any)
}

export const DOMConfig: TDOMConfig = {
    DomParser: undefined
}

export const DOMMimeTypeTextHTML = "text/html"
export const DOMMimeTypeImageSvg = "image/svg+xml"

var DomParserInstance: any = undefined

export function DomParse(text: string, type: string=DOMMimeTypeTextHTML): any {
    if (DomParserInstance === undefined) {
        if (DOMConfig.DomParser === undefined) {
            throw new Error("DOMConfig.DomParser must be defined to create a DomParser.");
        }
        DomParserInstance = DOMConfig.DomParser()
    }
    return DomParserInstance.parseFromString(text, type)
}

export function QuerySelector(doc: any, selector: string): any {
    return doc.querySelector(selector)
}
