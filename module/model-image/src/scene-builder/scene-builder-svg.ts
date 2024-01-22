import { ComplexVector } from "../math/complex-numbers"
import { Point } from "../math/geometry"
import { degreesToRadians } from "../math/utils"
import { Parameter } from "../parameters/parameters"
import { SvgCanvas } from "../svg/svg-support"
import { setPropertyIfNotExists } from "../utils/utils"

export type TCallback =  {order: number, cb: ((v: any) => void)}

export class SceneBuilder {

    parameters: Parameter[] = []
    _parameterCallbacks: { [key: string]: TCallback[] } = {}
    _parameterUpdatePending: boolean

    constructor() {
        this._parameterUpdatePending = false
    }

    addParameter(p: Parameter) {
        this.parameters.push(p)
    }

    addParameterCallback(p: string, order: number, cb: (v: any) => void) {
        if (!this._parameterCallbacks[p]) {
            this._parameterCallbacks[p] = []
        }
        this._parameterCallbacks[p].push({order, cb})
    }

    invokeParameterCallbacks(p: string, v: any) {
        if (this._parameterUpdatePending) {
            return
        }
        this._parameterUpdatePending = true
        try {
            if (this._parameterCallbacks[p]) {
                const cbs = this._parameterCallbacks[p]
                const scbSorted = cbs.sort((a, b)=>a.order-b.order)
                scbSorted.forEach(cb => cb.cb(v))
            }
        } catch (error) {
            throw error
        } finally {
            this._parameterUpdatePending = false
        }
    }



}

export class SceneBuilder2D extends SceneBuilder {

    scene: SvgCanvas | undefined
    _canvas: HTMLDivElement | null = null

    createStandardScene(canvas: HTMLDivElement|null, height: number, width: number, scale=1) {
        this._canvas = canvas
        this.scene = new SvgCanvas(height,width, scale*height,scale*width, canvas);
    }

    getScene(): SvgCanvas {
        if (! this.scene) {
            throw new Error("Scene is not set");
        }
        return this.scene
    }

    startSubFigure(tr: string) {
        return this.getScene().startSubFigure(tr)
    }

    endSubFigure() {
        this.getScene().endSubFigure()
    }


    addLine(startPoint: Point, endPoint: Point, attributes: any, beginMarker=false, endMarker=false, parentNode?: any) {
        return this.getScene().addLine(startPoint, endPoint, attributes, beginMarker, endMarker)

    }

    addLaTeX(formula: string, position: Point, scale: number, color: string = "#000000", parentNode?: any) {
        return this.getScene().addLaTeX(formula, position, scale, color, parentNode)
    }



}