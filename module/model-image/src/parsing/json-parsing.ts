/* eslint-disable no-eval */
import * as BBL from "babylonjs"
import * as LA from 'ml-matrix'
import { CSSColorToBBLColor4, SceneBuilder3D } from "../babylon/support"
import { LAColumnVector3DToPoint3D, LAColumnVectorToPoint, LAColumnVectors3DToPoints3D, Point, Point3D, Point3DTransform, PointTransform, Points3D, Points3DTransformDefault, PointsTransformDefault, RegularPolygon, ZeroPoint3D, addPoint, addPoint3D, addPoints3D, angleOfPoint, circlePoints, length, clipPoints, ensureLAVector, ensurePoint, ensurePoint3D, makeBasis, nonUniformScaleOfTransform, normalizeLA, perpendicularVector, projectOntoSpan, rotatePoint, scaleOfTransform, scaleOfTransform3D, scalePoint, scalePoint3D, scalePoints3D, separateByPlane, splitByPlane, subPoint3D, toPoints3DTransform, vectorInBasis, scaleOfPolarTransform } from "../math/geometry";
import { DefaultArrow, NumberOfManifoldPoints } from "../babylon/settings"
import { generateRandomData } from "../utils/data"
import { deepCopy, evalInContext, linSpace, linSpaceDelta, loadData, setPropertyIfNotExists, shallowCopy, transferAttributes, transferPropertiesIfNotExist } from "../utils/utils"
import { Parameter } from "../parameters/parameters"
import { degreesToRadians } from "../math/utils"
import { axes2D1Q, axes2D4Q, axes2D4QTransform, axes3D1Q, axes3D8Q } from "../graphics/axes"
import { MatrixInverse, MatrixProduct, MatrixVectorProduct, PowerMethod, SingularValueDecomposition, innerProduct } from "../math/linear-algebra"
import { SceneBuilder, SceneBuilder2D } from "../scene-builder/scene-builder-svg"
import { axes3DIsometric1Q, axes3DIsometric8Q, axes3DPerspective1Q, axes3DPerspective8Q } from "../graphics/axes3d"
import { cAbs, cAddVectors, cInnerProduct, cScaleVector } from "../math/complex-numbers"
import { rnGen } from "../utils/random"
import { ColorPalette } from "../config/colors";

export var SceneData: any = {
    inBasis: vectorInBasis,
    project: projectOntoSpan,
    scalePoint: scalePoint,
    scalePoint3D: scalePoint3D,
    scalePoints3D: scalePoints3D,
    clipPoints: clipPoints,
    addPoint: addPoint,
    addPoint3D: addPoint3D,
    addPoints3D: addPoints3D,
    rotatePoint: rotatePoint,
    angleOfPoint: (p: Point) => angleOfPoint(p) / Math.PI * 180,
    euclideanNorm: length,
    VectorToPoint: LAColumnVectorToPoint,
    VectorToPoint3D: LAColumnVector3DToPoint3D,
    RegularPolygon: RegularPolygon,
    cAbs: cAbs,
    cAddVectors: cAddVectors,
    cScaleVector: cScaleVector,
    cInnerProduct: cInnerProduct,
    MatrixInverse: MatrixInverse,
    MatrixProduct: MatrixProduct,
    MatrixVectorProduct: MatrixVectorProduct,
    SingularValueDecomposition: SingularValueDecomposition,
    PowerMethod: PowerMethod,
    perpendicularVector: perpendicularVector,
    linSpace,
    linSpaceDelta,
    rnGen,
    loadData,
    parameters: {},
    variables: {},
    randomData: {},
    arrays: {
        level: 0,
        indices: [],
        getH: () => { return SceneData.arrays.indices[SceneData.arrays.level - 1].horizontal },
        getV: () => { return SceneData.arrays.indices[SceneData.arrays.level - 1].vertical }
    }
}

export function updateSceneData(newSD: any) {
    SceneData = {
        ...SceneData,
        ...newSD
    }
}

abstract class JSonSceneParser {

    _sceneBuilder: SceneBuilder
    sceneDescription: any
    _dataProcessed: boolean = false

    constructor(json: any) {
        if (typeof json === 'string') {
            this.sceneDescription = JSON.parse(json);
        } else {
            this.sceneDescription = json
        }
        this._sceneBuilder = this.createSceneBuilder()
    }

    abstract createSceneBuilder(): SceneBuilder

    getParameters(): Parameter[] {

        this.processData()
        return this._sceneBuilder.parameters
    }

    processData() {
        if (!this._dataProcessed) {
            if (this.sceneDescription.data !== undefined) {
                this.sceneDescription['data'].forEach((d: any) => {
                    switch (d[0]) {
                        case 'makeBasis':
                            if (!SceneData.bases) {
                                SceneData.bases = {}
                            }
                            SceneData.bases[d[1].name] = makeBasis(d[1].alpha, d[1].beta)
                            SceneData.basis = SceneData.bases[d[1].name]
                            break

                        case 'comment':
                            break

                        case 'vectors':
                            SceneData.vectors = {}
                            d[1].forEach((v: any) => {
                                this.addDataVector(v)
                            })
                            break

                        case 'parameter':
                            const pn = d[1].name
                            SceneData.parameters[pn] = evalInContext(d[1].initialValue, { SceneData })
                            this.addParameter(d[1])
                            break

                        case 'parameters':
                            d[1].forEach((p: any) => {
                                SceneData.parameters[p.name] = evalInContext(p.initialValue, { SceneData })
                                this.addParameter(p)
                            })
                            break

                        case 'variable':
                            this.addVariable(d[1])
                            break

                        case 'variables':
                            d[1].forEach((v: any) => {
                                this.addVariable(v)
                            })
                            break

                        case 'randomData':
                            this.addRandomData(d[1])
                            break

                        default:
                            throw new Error(`Unknown data element: ${d[0]}`);
                    }
                })

            }
        }
        this._dataProcessed = true
    }

    addVariable(v: any) {
        SceneData.variables[v.name] = evaluateSpec(v.value)
        if (!(v.updateOn === undefined)) {
            this.setupUpdateCallbacks(v, (value: any) => {
                SceneData.variables[v.name] = evaluateSpec(v.value)
            })
        }
    }

    addRandomData(r: any) {

        setPropertyIfNotExists(r, "mean", 0)
        setPropertyIfNotExists(r, "seed", 1)
        setPropertyIfNotExists(r, "variance", 1)
        SceneData.randomData[r.name] = generateRandomData(r.length, r.type, r.mean, r.variance, evaluateNumberSpec(r.numberOfSamples), evaluateNumberSpec(r.seed))


        if (!(r.updateOn === undefined)) {
            this.setupUpdateCallbacks(r, (value: any) => {
                SceneData.randomData[r.name] = generateRandomData(r.length, r.type, r.mean, r.variance, evaluateNumberSpec(r.numberOfSamples), evaluateNumberSpec(r.seed))
            })
        }
    }

    addDataVector(v: any) {
        SceneData.vectors[v.name] = evaluateSpec(v.value)
        if (!(v.updateOn === undefined)) {
            this.setupUpdateCallbacks(v, (value: any) => {
                SceneData.vectors[v.name] = evaluateSpec(v.value)
            })
        }
    }

    addParameter(par: Parameter) {
        const p = { ...par }
        SceneData.parameters[p.name] = evalInContext(p.initialValue, { SceneData })
        this._sceneBuilder.addParameterCallback(p.name, par.order, (v: any) => { SceneData.parameters[p.name] = evalInContext(v, { SceneData }) })
        p.onChange = (v: number) => {
            this._sceneBuilder.invokeParameterCallbacks(p.name, v)
        }
        this._sceneBuilder.addParameter(p)
    }

    setupUpdateCallbacks(o: any, cb: (value: any) => void) {
        if (!(o.updateOn === undefined)) {
            const order = o.updateOrder === undefined ? 100 : o.updateOrder
            o.updateOn.forEach((p: string) => {
                this._sceneBuilder.addParameterCallback(p, order, cb)
            })
        }
    }

}

export class JSonSceneParser3D extends JSonSceneParser {

    createSceneBuilder(): SceneBuilder {
        return new SceneBuilder3D()
    }

    sceneBuilder3D(): SceneBuilder3D {
        return this._sceneBuilder as SceneBuilder3D
    }

    createScene(engine: BBL.Engine, canvas: HTMLCanvasElement) {
        this.sceneBuilder3D().createStandardScene(engine, canvas)
        if (!this.sceneBuilder3D().scene) {
            throw new Error("Failed to create scene.");

        }

        this.processElements()
        return this.sceneBuilder3D().scene
    }

    processElements() {
        if (this.sceneDescription['elements']) {
            this.sceneDescription['elements'].forEach((e: any) => {
                switch (e[0]) {
                    case 'axis-3d':
                        this.makeAxis3D(e[1])
                        break;

                    default:
                        console.warn(`Skipping unknown element in 3D parser: ${e[0]}`);
                        break;
                }
            })
        }

    }

    makeAxis3D(axisSpec: any) {
        switch (axisSpec['type']) {
            case 'Isometric8Q':
            case 'Perspective8Q':
                axes3D8Q(this.sceneBuilder3D(),
                    axisSpec['xDom'],
                    axisSpec['yDom'],
                    axisSpec['zDom'],
                    this.sceneBuilder3D().root)
                break;

            case 'Isometric1Q':
            case 'Perspective1Q':
                axes3D1Q(this.sceneBuilder3D(),
                    axisSpec['xDom'],
                    axisSpec['yDom'],
                    axisSpec['zDom'],
                    this.sceneBuilder3D().root
                )
                break;

            default:
                console.error("Axis-3d of unknown type")
                break;
        }

        if (axisSpec.hasOwnProperty("content")) {
            const content = axisSpec['content']
            content.forEach((c: any) => {
                this.addAxis3DContent(c)
            })
        }
    }

    addAxis3DContent(c: any) {
        switch (c[0]) {

            case 'vector':
                this.addVector(c[1])
                break

            case 'vectors':
                this.addVectors(c[1])
                break

            case 'line':
                this.addLine(c[1])
                break

            case 'lines':
                this.addLines(c[1])
                break

            case 'ellipse':
                // this.addEllipse(c[1])
                break

            case 'sphere':
                this.addSphere(c[1])
                break

            case 'polyline':
                // this.addPolyline(c[1])
                break

            case 'polylines':
                // this.addPolylines(c[1])
                break

            case 'polygon':
                // this.addPolygon(c[1])
                break

            case 'span2D':
                this.addSpan2D(c[1])
                break;

            case 'dataset':
                this.addDataset(c[1])
                break

            case 'comment':
                //just skip
                break

            default:
                throw new Error(`Unknown axis content type: ${c[0]}.`)
        }

    }

    makeLine(l: any) {
        const el = { ...l }
        const p1 = evaluateVectorSpec(el.p1)
        const p2 = evaluateVectorSpec(el.p2)

        var color = new BBL.Color4(0, 0, 0, 1)
        if (el.attributes) {
            if (el.attributes.stroke) {
                color = CSSColorToBBLColor4(el.attributes.stroke)
            }
        }
        return this.sceneBuilder3D().addLine(p1, p2, color, false)
    }

    addLine(l: any) {
        var line = this.makeLine(deepCopy(l))
        this.setupUpdateCallbacks(l, (v: any) => {
            this.sceneBuilder3D().scene?.removeMesh(line)
            line = this.makeLine(deepCopy(l))
        })
    }

    makeSpan2D(s: any) {
        const se = { ...s }
        const axis1 = evaluateVectorSpec(se.axis1)
        const axis2 = evaluateVectorSpec(se.axis2)
        return this.sceneBuilder3D().addSpan2D(axis1, axis2)
    }

    addSpan2D(s: any) {
        var span = this.makeSpan2D(deepCopy(s))
        this.setupUpdateCallbacks(s, (v: any) => {
            this.sceneBuilder3D().scene?.removeMesh(span)
            span = this.makeSpan2D(deepCopy(s))
        })
    }

    addLines(ls: any) {
        ls.lines.forEach((l: any) => {
            this.cloneProperties(['attributes', 'updateOn'], ls, l)
            this.addLine(l)
        })
    }

    makeVector(v: any) {
        const p1 = evaluateVectorSpec(v.p1)
        const p2 = evaluateVectorSpec(v.p2)
        var color = new BBL.Color4(0, 0, 0, 1)
        if (v.attributes) {
            if (v.attributes.stroke) {
                color = CSSColorToBBLColor4(v.attributes.stroke)
            }
        }

        return this.sceneBuilder3D().addDirectedArrow(p1, p2, DefaultArrow, color)
    }

    addVector(v: any) {
        var vMesh: any
        vMesh = this.makeVector(deepCopy(v))
        this.setupUpdateCallbacks(v, (value: any) => {

            if (vMesh) {
                this.sceneBuilder3D().scene?.removeMesh(vMesh)
            }
            vMesh = this.makeVector(deepCopy(v))
        })
    }

    addVectors(vs: any) {
        vs.vectors.forEach((v: any) => {
            this.cloneProperties(['attributes', 'updateOn'], vs, v)
            this.addVector(v)
        })
    }


    makeSphere(s: any) {
        var es = { ...s }
        var color = new BBL.Color4(0, 0, 0, 1)
        if (es.attributes) {
            if (es.attributes.fill) {
                color = CSSColorToBBLColor4(es.attributes.fill)
            }
        }

        const center = evaluateVectorSpec(es.center)

        return this.sceneBuilder3D().addSphere(center, es.radius, color)
    }

    addSphere(s: any) {
        var sMesh = this.makeSphere(s)
        this.setupUpdateCallbacks(s, (value: any) => {
            this.sceneBuilder3D().scene?.removeMesh(sMesh)
            sMesh = this.makeSphere(s)
        })
    }

    cloneProperties(lp: string[], o1: any, o2: any) {
        lp.forEach(p => {
            if (o1.hasOwnProperty(p)) {
                // maybe should be deep copy...
                o2[p] = o1[p]
            }
        })
    }

    makeDataset(data: any) {

        const points = evaluatePoints3DSpec(data.points)
        const meshes: BBL.Mesh[] = []

        if (data.normals) {
            const normalColor = CSSColorToBBLColor4(getStrokeAttribute(data.normals, "#000000"))
            const dir = normalizeLA(evaluateVectorSpec(data.normals.direction))
            const lines = points.map(p => {
                return [
                    p,
                    LA.Matrix.sub(p, LA.Matrix.mul(dir, innerProduct(p, dir)))
                ]
            })
            lines.forEach(l => {
                meshes.push(this.sceneBuilder3D().addLine(l[0], l[1],
                    normalColor, hasStrokeAttribute(data.normals)))
            })
        }


        if (points) {
            points.forEach(p => {
                meshes.push(this.sceneBuilder3D().addSphere(p, data.radius, CSSColorToBBLColor4(getFillAttribute(data, "#000000"))))
            })
        }

        return meshes
    }

    addDataset(data: any) {
        // if it is one sides, only show if front
        var show = true
        if (data.hasOwnProperty('oneSide')) {
            show = data.oneSide.side === 'front'
        }
        if (show) {
            var sData = this.makeDataset(data)
            this.setupUpdateCallbacks(data, (value: any) => {
                sData.forEach((m: any) => this.sceneBuilder3D().scene?.removeMesh(m))
                sData = this.makeDataset(data)
            })
        }
    }

}


export class JSonSceneParser2D extends JSonSceneParser {

    _dataProcessed: boolean = false

    createSceneBuilder(): SceneBuilder {
        return new SceneBuilder2D()
    }

    sceneBuilder2D(): SceneBuilder2D {
        return this._sceneBuilder as SceneBuilder2D
    }


    addVariable(v: any) {
        SceneData.variables[v.name] = evaluateSpec(v.value)
        this.setupUpdateCallbacks(v, (val: any) => {
            SceneData.variables[v.name] = evaluateSpec(v.value)
        }
        )
    }

    createScene(canvas: HTMLDivElement | null, scale: number = 1) {
        setPropertyIfNotExists(this.sceneDescription, "canvas", {})
        setPropertyIfNotExists(this.sceneDescription.canvas, "height", 400)
        setPropertyIfNotExists(this.sceneDescription.canvas, "width", 600)
        this.sceneBuilder2D().createStandardScene(canvas, this.sceneDescription.canvas.height, this.sceneDescription.canvas.width, scale)
        if (!this.sceneBuilder2D().scene) {
            throw new Error("Failed to create scene.");
        }
        this.processData()
        if (this.sceneDescription['elements']) {
            this.processElements(this.sceneDescription['elements'])
        }
        return this.sceneBuilder2D().scene
    }

    processElement(e: any[]) {
        switch (e[0]) {
            case 'axis-2d':
                this.addAxis2D(e[1])
                break;

            case 'axis-3d':
                this.addAxis3D(e[1])
                break

            case 'line':
                this.addLine(e[1])
                break

            case 'lines':
                this.addLines(e[1])
                break

            case 'path':
                this.addPath(e[1])
                break

            case 'polyline':
                this.add2DPolyline(e[1], PointsTransformDefault)
                break

            case 'polylines':
                this.add2DPolylines(e[1], PointsTransformDefault)
                break

            case 'polygon':
                this.add2DPolygon(e[1], PointsTransformDefault)
                break

            case 'polygons':
                this.add2DPolygons(e[1], PointsTransformDefault)
                break

            case 'rectangle':
                this.add2DRectangle(e[1], PointsTransformDefault)
                break

            case 'rectangles':
                this.add2DRectangles(e[1], PointsTransformDefault)
                break

            case 'circle':
                this.add2DCircle(e[1], PointsTransformDefault)
                break

            case 'circles':
                this.add2DCircles(e[1], PointsTransformDefault)
                break

            case 'ellipse':
                this.add2DEllipse(e[1], PointsTransformDefault)
                break

            case 'arc':
                this.add2DArc(e[1], PointsTransformDefault)
                break

            case 'arcs':
                this.add2DArcs(e[1], PointsTransformDefault)
                break

            case 'arrow':
                this.addArrow(e[1])
                break

            case 'arrows':
                this.addArrows(e[1])
                break

            case 'fat-arrow':
                this.sceneBuilder2D().getScene().addFatArrow(e[1])
                break

            case 'vector':
                this.add2DVector(e[1], PointsTransformDefault)
                break

            case 'vectors':
                this.add2DVectors(e[1], PointsTransformDefault)
                break

            case 'text':
                this.addText(e[1])
                break

            case 'texts':
                this.addTexts(e[1])
                break

            case 'latex-text':
                this.addLatexText(e[1])
                break

            case 'latex-texts':
                this.addLatexTexts(e[1])
                break

            case 'barChart':
                this.sceneBuilder2D().getScene().addBarChart(e[1].yDom, e[1].origin, e[1].scale, e[1].width, e[1].axisLabels, e[1].tickValuesY, e[1].data, e[1].fontSize)
                break

            case 'function-plot':
                this.addFunctionPlot(e[1])
                break

            case 'subFigure':
                this.sceneBuilder2D().startSubFigure(e[1].transform)
                this.processElements(e[1].elements)
                this.sceneBuilder2D().endSubFigure()
                break

            case 'stencil':
                setPropertyIfNotExists(e[1], "offsets", [[0, 0]])
                e[1].offsets = evaluateSpec(e[1].offsets)
                setPropertyIfNotExists(e[1], "rotations", e[1].offsets.map(((_: any) => 0)))
                setPropertyIfNotExists(e[1], "scales", e[1].offsets.map(((_: any) => 1)))
                e[1].rotations = evaluateSpec(e[1].rotations)
                e[1].scales = evaluateSpec(e[1].scales)
                e[1].offsets.forEach((o: Point, i: number) => {
                    this.sceneBuilder2D().startSubFigure(`translate(${o[0]},${o[1]}) rotate(${e[1].rotations[i]}) scale(${e[1].scales[i]})`)
                    this.processElements(e[1].elements)
                    this.sceneBuilder2D().endSubFigure()
                })
                break

            case 'array':
                SceneData.arrays.level += 1
                SceneData.arrays.indices = SceneData.arrays.indices.concat([{ horizontal: 0, vertical: 0 }])
                setPropertyIfNotExists(e[1], "horizontal", 1)
                setPropertyIfNotExists(e[1], "vertical", 1)
                setPropertyIfNotExists(e[1], "deltaHorizontal", 0)
                setPropertyIfNotExists(e[1], "deltaVertical", 0)
                for (let h = 0; h < e[1].horizontal; h++) {
                    SceneData.arrays.indices[SceneData.arrays.level - 1].horizontal = h
                    for (let v = 0; v < e[1].vertical; v++) {
                        SceneData.arrays.indices[SceneData.arrays.level - 1].vertical = v
                        this.sceneBuilder2D().startSubFigure(`translate(${h * e[1].deltaHorizontal},${v * e[1].deltaVertical})`)
                        this.processElements(deepCopy(e[1].elements))
                        this.sceneBuilder2D().endSubFigure()
                    }
                }
                SceneData.arrays.indices.pop()
                SceneData.arrays.level -= 1
                break

            case 'bitmap':
                e[1].data = evaluateSpec(e[1].data)
                this.addBitmap(e[1])
                break

            case 'comment':
                break

            default:
                console.warn(`Skipping unknown element in 2D parser: ${e[0]}`);
                break;
        }
    }

    processElements(elements: any[]) {
        elements.forEach((e: any) => {
            this.processElement(e)
        })
    }

    addAxis2D(axisSpec: any) {
        var axisTransform: PointTransform = PointsTransformDefault
        setPropertyIfNotExists(axisSpec, "options", {})
        if (!(axisSpec.scale.constructor === Array)) {
            axisSpec.scale = [axisSpec.scale, axisSpec.scale]
        }

        const xRange: [number, number] = [
            axisSpec.center[0] + axisSpec.scale[0] * axisSpec.xDom[0],
            axisSpec.center[0] + axisSpec.scale[0] * axisSpec.xDom[1]
        ]
        const yRange: [number, number] = [
            axisSpec.center[1] - axisSpec.scale[1] * axisSpec.yDom[0],
            axisSpec.center[1] - axisSpec.scale[1] * axisSpec.yDom[1]
        ]

        this.sceneBuilder2D().getScene().addRectangle([xRange[0], yRange[1]], [xRange[1] - xRange[0], yRange[0] - yRange[1]], { stroke: "none", fill: "#ffffff" })

        if (axisSpec.hasOwnProperty("background-content")) {
            const axisTransform = axes2D4QTransform(axisSpec.xDom, xRange, axisSpec.yDom, yRange)
            const content = axisSpec['background-content']
            content.forEach((c: any) => {
                this.addAxis2DContent(c, axisTransform)
            })
        }

        switch (axisSpec.type) {
            case '4Q':
                axisTransform = axes2D4Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    xRange,
                    axisSpec.yDom,
                    yRange, axisSpec.options)
                break

            case '1Q':
                axisTransform = axes2D1Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    xRange,
                    axisSpec.yDom,
                    yRange, axisSpec.options)
                break


            default:
                throw new Error(`Axis-2d of unknown type: ${axisSpec.type}`)
        }

        if (axisSpec.hasOwnProperty("content")) {
            const content = axisSpec['content']
            content.forEach((c: any) => {
                this.addAxis2DContent(c, axisTransform)
            })
        }
    }

    make2DRectangle(r: any, at: PointTransform, parent?: any) {
        setPropertyIfNotExists(r, "top", 0)
        setPropertyIfNotExists(r, "left", 0)
        setPropertyIfNotExists(r, "width", 50)
        setPropertyIfNotExists(r, "height", 50)

        setPropertyIfNotExists(r, "attributes", {})
        setPropertyIfNotExists(r.attributes, "stroke", "#000000")
        setPropertyIfNotExists(r.attributes, "stroke-width", 1)
        r.top = evaluateNumberSpec(r.top)
        r.left = evaluateNumberSpec(r.left)
        r.width = evaluateNumberSpec(r.width)
        r.height = evaluateNumberSpec(r.height)
        const scale = nonUniformScaleOfTransform(at)
        return this.sceneBuilder2D().getScene().addRectangle(at([r.left, r.top]), [scale[0] * r.width, Math.abs(scale[1]) * r.height], r.attributes, parent)
    }

    add2DRectangle(r: any, at: PointTransform, parent?: any) {
        var rect = this.make2DRectangle(deepCopy(r), at, parent)
        if (parent === undefined) {
            parent = rect?.parentNode
        }
        this.setupUpdateCallbacks(r, (v: any) => {
            this.sceneBuilder2D().scene?.removeElement(rect)
            rect = this.make2DRectangle(deepCopy(r), at, parent)
        })
        return rect
    }


    add2DRectangles(rs: any, at: PointTransform) {
        rs.rectangles.forEach((r: any) => {
            transferAttributes(rs, r)
            transferPropertiesIfNotExist(rs, r, ["top", "left", "height", "width"])
            this.add2DRectangle(r, at)
        })
    }

    make2DCircle(c: any, at: PointTransform, parent?: any) {
        setPropertyIfNotExists(c, "radius", 1)
        setPropertyIfNotExists(c, "center", [0, 0])
        setPropertyIfNotExists(c, "attributes", {})
        setPropertyIfNotExists(c.attributes, "stroke", "#000000")
        setPropertyIfNotExists(c.attributes, "stroke-width", 1.5)
        setPropertyIfNotExists(c.attributes, "fill", "none")
        c.center = evaluateSpec(c.center)
        c.color = c.attributes.stroke

        const trRadius = scaleOfTransform(at) * c.radius
        return this.sceneBuilder2D().getScene().addCircle(at(c.center), trRadius, c.attributes, parent)
    }

    add2DCircle(c: any, at: PointTransform, parent?: any) {
        var circle = this.make2DCircle(deepCopy(c), at, parent)
        if (parent === undefined && circle !== null) {
            parent = circle.parentNode
        }
        this.setupUpdateCallbacks(c, (v: any) => {
            this.sceneBuilder2D().scene?.removeElement(circle)
            circle = this.make2DCircle(deepCopy(c), at, parent)
        })
        return circle
    }

    add2DCircles(cs: any, at: PointTransform, parent?: any) {
        const elements: any[] = []
        cs.circles.forEach((c: any) => {
            transferAttributes(cs, c)
            transferPropertiesIfNotExist(cs, c, ["center", "radius"])
            elements.push(this.add2DCircle(c, at, parent))
        })
        return elements
    }

    make2DEllipse(e: any, at: PointTransform, parentNode?: any) {
        setPropertyIfNotExists(e, "attributes", {})
        setPropertyIfNotExists(e.attributes, "stroke", "#000000")
        setPropertyIfNotExists(e.attributes, "stroke-width", 1.5)
        e["radius-major"] = evaluateSpec(e["radius-major"])
        e["radius-minor"] = evaluateSpec(e["radius-minor"])
        e.angle = evaluateSpec(e.angle)
        e.center = evaluateSpec(e.center)
        const trRadiusMajor = scaleOfTransform(at) * e["radius-major"]
        const trRadiusMinor = scaleOfTransform(at) * e["radius-minor"]

        return this.sceneBuilder2D().getScene().addEllipse(at(e.center), trRadiusMajor, trRadiusMinor, e.angle, e.attributes, parentNode)

    }

    add2DEllipse(e: any, at: PointTransform): any {
        var ellipse = this.make2DEllipse(deepCopy(e), at)
        this.setupUpdateCallbacks(e, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(ellipse)
            ellipse = this.make2DEllipse(deepCopy(e), at, parentNode)
        })
        return ellipse
    }

    determineMarkers(arrowHeadsSpec: string) {
        var beginMarker: boolean
        var endMarker: boolean
        switch (arrowHeadsSpec) {
            case "none":
                beginMarker = false
                endMarker = false
                break;

            case "begin":
                beginMarker = true
                endMarker = false
                break;

            case "end":
                beginMarker = false
                endMarker = true
                break;

            case "both":
                beginMarker = true
                endMarker = true
                break;

            default:
                throw new Error(`Unknown arrowHeads spec: ${arrowHeadsSpec}`);
        }
        return { beginMarker, endMarker }
    }


    make2DArc(a: any, at: PointTransform, polar: boolean, parentNode?: any): any {
        // {"center": [75,175], "radius": 60, "start-angle": 90, "end-angle": 120},
        setPropertyIfNotExists(a, "center", [0, 0])
        setPropertyIfNotExists(a, "radius", 1)
        setPropertyIfNotExists(a, "start-angle", 0)
        setPropertyIfNotExists(a, "end-angle", 45)
        setPropertyIfNotExists(a, "attributes", {})
        setPropertyIfNotExists(a.attributes, "stroke", "#000000")
        setPropertyIfNotExists(a.attributes, "stroke-width", 1)
        setPropertyIfNotExists(a.attributes, "fill", "none")
        setPropertyIfNotExists(a, "arrowHeads", "none")

        a.center = evaluatePointSpec(a.center)
        a.radius = evaluateNumberSpec(a.radius)
        a['start-angle'] = evaluateNumberSpec(a['start-angle'])
        a['end-angle'] = evaluateNumberSpec(a['end-angle'])

        if (a['start-angle'] > a['end-angle']) {
            const sa = a['start-angle']
            a['start-angle'] = a['end-angle']
            a['end-angle'] = sa
        }

        const { beginMarker, endMarker } = this.determineMarkers(a.arrowHeads)

        a['end-angle'] = evaluateSpec(a['end-angle'])
        a['start-angle'] = evaluateSpec(a['start-angle'])

        const trRadius: number = polar ? scaleOfPolarTransform(at) * a.radius : scaleOfTransform(at) * a.radius
        return this.sceneBuilder2D().getScene().addArc(at(a.center), trRadius, degreesToRadians(a['start-angle']), degreesToRadians(a['end-angle']), a.attributes, beginMarker, endMarker, parentNode)
    }

    add2DArc(a: any, at: PointTransform, polar = false, parentNode?: any): any {
        var arc = this.make2DArc(deepCopy(a), at, polar, parentNode)
        this.setupUpdateCallbacks(a, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(arc)
            arc = this.make2DArc(deepCopy(a), at, polar, parentNode)
        })
        return arc
    }

    make2DArcs(as: any, at: PointTransform, polar: boolean, parentNode?: any): any[] {

        const elements: any[] = []
        as.arcs = evaluateArrayOfSpecs(as.arcs)
        as.arcs.forEach((a: any) => {
            transferAttributes(as, a)
            transferPropertiesIfNotExist(as, a, ["arrowHeads"])
            elements.push(this.add2DArc(a, at, polar, parentNode))
        })
        return elements
    }

    add2DArcs(as: any, at: PointTransform, polar = false): any {
        var arcs = this.make2DArcs(deepCopy(as), at, polar)
        this.setupUpdateCallbacks(as, (value: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElements(arcs)
            arcs = this.make2DArcs(deepCopy(as), at, polar, parentNode)
        })
        return arcs
    }

    addArrow(a: any) {
        setPropertyIfNotExists(a, "p1", [0, 0])
        setPropertyIfNotExists(a, "p2", [50, 50])
        setPropertyIfNotExists(a, "attributes", {})
        setPropertyIfNotExists(a.attributes, "stroke", "#000000")
        setPropertyIfNotExists(a.attributes, "stroke-width", 1.5)
        setPropertyIfNotExists(a.attributes, "fill", "none")
        setPropertyIfNotExists(a.attributes, "stroke-linecap", 'round')
        setPropertyIfNotExists(a.attributes, "stroke-linejoin", 'round')
        setPropertyIfNotExists(a, "double-headed", false)
        a.color = a.attributes.stroke

        this.sceneBuilder2D().getScene().addLine(a['p1'], a['p2'], a.attributes, a['double-headed'], true,)
    }

    addArrows(as: any) {
        as.arrows.forEach((a: any) => {
            transferAttributes(as, a)
            transferPropertiesIfNotExist(as, a, ["double-headed"])
            this.addArrow(a)
        })
    }


    make2DPolyline(pl: any, at: PointTransform, parentNode?: any): any {
        pl.points = evaluateArrayOfSpecs(pl.points)
        setPropertyIfNotExists(pl, "attributes", {})
        setPropertyIfNotExists(pl.attributes, "stroke", "#000000")
        setPropertyIfNotExists(pl.attributes, "stroke-width", 1)
        setPropertyIfNotExists(pl.attributes, "fill", "none")
        const points = pl.points.map((p: Point) => at(p))
        setPropertyIfNotExists(pl, "arrowHeads", "none")

        const { beginMarker, endMarker } = this.determineMarkers(pl.arrowHeads)

        return this.sceneBuilder2D().getScene().addPolyline(points, pl.attributes, beginMarker, endMarker, parentNode)
    }

    add2DPolyline(pl: any, at: PointTransform): any {
        var polyline = this.make2DPolyline(deepCopy(pl), at)
        this.setupUpdateCallbacks(pl, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(polyline)
            polyline = this.make2DPolyline(deepCopy(pl), at, parentNode)
        })
        return polyline
    }


    add2DPolylines(pls: any, at: PointTransform) {
        pls.polylines.forEach((pl: any) => {
            transferAttributes(pls, pl)
            transferPropertiesIfNotExist(pls, pl, ["arrowHeads"])
            this.add2DPolyline(pl, at)
        })
    }

    add2DPolygon(pg: any, at: PointTransform): any {
        setPropertyIfNotExists(pg, "attributes", {})
        setPropertyIfNotExists(pg.attributes, "stroke", "#000000")
        setPropertyIfNotExists(pg.attributes, "stroke-width", 1.5)
        setPropertyIfNotExists(pg.attributes, "fill", "none")
        pg.points = evaluateArrayOfSpecs(pg.points)
        const points = pg.points.map((p: Point) => at(p))

        return this.sceneBuilder2D().getScene().addPolygon(points, pg.attributes)
    }

    add2DPolygons(pls: any, at: PointTransform) {
        pls.polygons.forEach((pl: any) => {
            transferAttributes(pls, pl)
            this.add2DPolygon(pl, at)
        })
    }

    addPath(l: any) {
        this.setDefaultSolidAttributes(l, {})
        setPropertyIfNotExists(l, "arrowHeads", "none")
        const { beginMarker, endMarker } = this.determineMarkers(l.arrowHeads)

        this.sceneBuilder2D().getScene().addPath(l.string, l.attributes, beginMarker, endMarker)
    }

    addText(t: any) {
        setPropertyIfNotExists(t, "text", "text")
        setPropertyIfNotExists(t, "position", [0, 0])
        setPropertyIfNotExists(t, "fontSize", 1)
        setPropertyIfNotExists(t, "attributes", {})
        this.sceneBuilder2D().getScene().addText(t.text, t.position, t.fontSize, t.attributes)
    }

    addTexts(ts: any) {
        ts.texts.forEach((t: any) => {
            transferPropertiesIfNotExist(ts, t, ["fontSize", "attributes"])
            this.addText(t)
        })
    }


    setDefaultLineAttributes(l: any, defaultAttributes: any) {

        const stroke: string = defaultAttributes.hasOwnProperty('stroke') ? defaultAttributes.stroke : "#000000"
        const strokeWidth: string = defaultAttributes.hasOwnProperty('stroke-width') ? defaultAttributes['stroke-width'] : "1"

        setPropertyIfNotExists(l, "attributes", {})
        setPropertyIfNotExists(l.attributes, "stroke", stroke)
        setPropertyIfNotExists(l.attributes, "stroke-width", strokeWidth)
        setPropertyIfNotExists(l.attributes, "fill", "none")
    }

    setDefaultSolidAttributes(l: any, defaultAttributes: any) {

        this.setDefaultLineAttributes(l, defaultAttributes)

        const fill: string = defaultAttributes.hasOwnProperty('fill') ? defaultAttributes.fill : "none"
        setPropertyIfNotExists(l.attributes, "fill", fill)
    }

    addBitmap(b: any) {
        setPropertyIfNotExists(b, "position", [0, 0])
        setPropertyIfNotExists(b, "scale", 1)
        setPropertyIfNotExists(b, "height", 1)
        setPropertyIfNotExists(b, "width", 1)
        if (b.filename) {
            this.sceneBuilder2D().getScene().addBitmapFromFile(b.filename, b.position, b.width, b.height)
        } else {
            this.sceneBuilder2D().getScene().addBitmap(b.data, b.position, b.scale)
        }
    }

    addAxis3D(axisSpec: any) {
        setPropertyIfNotExists(axisSpec, 'options', {})
        setPropertyIfNotExists(axisSpec.options, 'showAxes', true)
        var axisTransform: Point3DTransform = Points3DTransformDefault
        var viewDirection: Point3D = [-1, -1, -1]
        switch (axisSpec['type']) {
            case 'Isometric8Q':
                ({ axisTransform, viewDirection } = axes3DIsometric8Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    axisSpec.yDom,
                    axisSpec.zDom,
                    axisSpec.center,
                    axisSpec.scale,
                    axisSpec.options
                ))
                break

            case 'Isometric1Q':
                ({ axisTransform, viewDirection } = axes3DIsometric1Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    axisSpec.yDom,
                    axisSpec.zDom,
                    axisSpec.center,
                    axisSpec.scale,
                    axisSpec.options
                ))
                break

            case 'Perspective8Q':
                ({ axisTransform, viewDirection } = axes3DPerspective8Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    axisSpec.yDom,
                    axisSpec.zDom,
                    axisSpec.center,
                    axisSpec.scale,
                    axisSpec.position,
                    axisSpec.target,
                    axisSpec.fieldOfView,
                    axisSpec.options
                ))
                break

            case 'Perspective1Q':
                ({ axisTransform, viewDirection } = axes3DPerspective1Q(
                    this.sceneBuilder2D().getScene(),
                    axisSpec.xDom,
                    axisSpec.yDom,
                    axisSpec.zDom,
                    axisSpec.center,
                    axisSpec.scale,
                    axisSpec.position,
                    axisSpec.target,
                    axisSpec.fieldOfView,
                    axisSpec.options
                ))
                break

            default:
                console.error("Axis-3d of unknown type")
                break
        }

        if (axisSpec.hasOwnProperty("content")) {
            const content = axisSpec['content']
            content.forEach((c: any) => {
                this.addAxis3DContent(c, axisTransform, viewDirection)
            })
        }
    }

    addAxis3DContent(c: any, at: Point3DTransform, viewDirection: Point3D) {
        switch (c[0]) {

            case 'standard-basis':
                this.addStandardBasis(c[1], at)
                break

            case 'vector':
                this.add3DVector(c[1], at)
                break

            case 'vectors':
                this.add3DVectors(c[1], at)
                break

            case 'line':
                this.add3DLine(c[1], at)
                break

            case 'lines':
                this.add3DLines(c[1], at)
                break

            case 'ellipse':
                this.add3DEllipse(c[1], at)
                break

            case 'sphere':
                this.addSphere(c[1], at)
                break

            case 'polyline':
                this.add3DPolyline(c[1], at)
                break

            case 'polylines':
                this.add3DPolylines(c[1], at)
                break

            case 'polygon':
                this.add3DPolygon(c[1], at)
                break

            case 'polygons':
                this.add3DPolygons(c[1], at)
                break

            case 'span2D':
                this.addSpan2D(c[1], at)
                break

            case 'dataset':
                this.addDataset(c[1], at, viewDirection)
                break

            case 'comment':
                //just skip
                break

            default:
                throw new Error(`Unknown axis content type: ${c[0]}.`)
        }

    }

    addAxis2DContent(c: any, at: PointTransform, polar = false): any[] {
        var elements: any[] = []
        switch (c[0]) {
            case 'vector':
                elements.push(this.add2DVector(c[1], at))
                break

            case 'vectors':
                elements.push(...this.add2DVectors(c[1], at))
                break

            case 'line':
                elements.push(this.add2DLine(c[1], at))
                break

            case 'lines':
                elements.push(...this.add2DLines(c[1], at))
                break

            case 'arrow':
                elements.push(this.add2DArrow(c[1], at))
                break

            case 'rectangle':
                elements.push(this.add2DRectangle(c[1], at))
                break

            case 'circle':
                elements.push(this.add2DCircle(c[1], at))
                break

            case 'circles':
                elements.push(...this.add2DCircles(c[1], at))
                break

            case 'ellipse':
                elements.push(this.add2DEllipse(c[1], at))
                break

            case 'arc':
                elements.push(this.add2DArc(c[1], at, polar))
                break

            case 'arcs':
                elements.push(...this.add2DArcs(c[1], at))
                break

            case 'polyline':
                elements.push(this.add2DPolyline(c[1], at))
                break

            case 'polygon':
                elements.push(this.add2DPolygon(c[1], at))
                break

            case 'dataset':
                elements.push(...this.add2DDataset(c[1], at))
                break

            case 'continuous-function':
                elements.push(this.addContinuousFunction(c[1], at))
                break

            case 'discrete-function':
                elements.push(this.addDiscreteFunction(c[1], at))
                break

            case 'array':
                elements.push(...this.addArrayToAxis(c[1], at))
                break


            case 'subFigure':
                this.sceneBuilder2D().startSubFigure(c[1].transform)
                elements.push(this.sceneBuilder2D().getScene().currentCanvas.node())
                c[1].elements.forEach((e: any) => {
                    this.addAxis2DContent(e, at)
                })
                this.sceneBuilder2D().endSubFigure()
                break

            case 'comment':
                //just skip
                break

            default:
                throw new Error(`Unknown axis content type: ${c[0]}.`)
        }
        return elements
    }

    make2DVector(v: any, at: PointTransform, parentNode?: any): any {
        setPropertyIfNotExists(v, "attributes", {})
        setPropertyIfNotExists(v.attributes, "stroke", "#000000")
        setPropertyIfNotExists(v.attributes, "stroke-width", 1.5)
        setPropertyIfNotExists(v.attributes, "fill", "none")
        setPropertyIfNotExists(v.attributes, "stroke-linecap", 'round')
        setPropertyIfNotExists(v.attributes, "stroke-linejoin", 'round')
        v.color = v.attributes.stroke
        v.p1 = ensurePoint(evaluateSpec(v.p1))
        v.p2 = ensurePoint(evaluateSpec(v.p2))

        const markerName = "red-arrow-" + (v.color.replace('#', ''))
        v.attributes["marker-end"] = `url(#${markerName})`

        this.sceneBuilder2D().getScene().addMarkerArrowheadOpenCurved(markerName, v.color)
        const vp = [at(v['p1']), at(v['p2'])]

        return this.sceneBuilder2D().getScene().addPolyline(vp, v.attributes, false, false, parentNode)
    }


    add2DVector(v: any, at: PointTransform, parentNode?: any): any {
        var vector = this.make2DVector(deepCopy(v), at, parentNode)
        this.setupUpdateCallbacks(v, (value: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(vector)
            vector = this.make2DVector(deepCopy(v), at, parentNode)
        })
        return vector
    }

    make2DVectors(vs: any, at: PointTransform, parentNode?: any): any[] {
        const elements: any[] = []
        vs.vectors = evaluateArrayOfSpecs(vs.vectors)
        vs.vectors.forEach((v: any) => {
            transferAttributes(vs, v)
            elements.push(this.add2DVector(v, at, parentNode))
        })
        return elements
    }

    add2DVectors(vs: any, at: PointTransform): any {
        var vectors = this.make2DVectors(deepCopy(vs), at)
        this.setupUpdateCallbacks(vs, (value: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElements(vectors)
            vectors = this.make2DVectors(deepCopy(vs), at, parentNode)
        })
        return vectors
    }


    add2DLine(l: any, at: PointTransform, parent?: any): any {
        this.setDefaultLineAttributes(l, {})
        l.p1 = evaluateSpec(l.p1)
        l.p2 = evaluateSpec(l.p2)
        return this.sceneBuilder2D().getScene().addLine(at(l.p1), at(l.p2), l.attributes, false, false, parent)

    }

    make2DArrow(a: any, at: PointTransform, parentNode?: any): any {
        this.setDefaultLineAttributes(a, {})
        a.p1 = evaluateSpec(a.p1)
        a.p2 = evaluateSpec(a.p2)
        setPropertyIfNotExists(a, "double-headed", false)
        a.color = a.attributes.stroke
        return this.sceneBuilder2D().getScene().addLine(at(a.p1), at(a.p2), a.attributes, a['double-headed'], true,)
    }

    add2DArrow(a: any, at: PointTransform): any {
        var arrow = this.make2DArrow(deepCopy(a), at)
        this.setupUpdateCallbacks(a, (value: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(arrow)
            arrow = this.make2DArrow(deepCopy(a), at, parentNode)
        })
        return arrow
    }

    make2DLines(ls: any, at: PointTransform, parent?: any) {
        ls.lines = evaluateArrayOfSpecs(ls.lines)
        const elements: any[] = []
        ls.lines.forEach((l: any) => {
            transferAttributes(ls, l)
            elements.push(this.add2DLine(l, at, parent))
        })
        return elements
    }


    add2DLines(ls: any, at: PointTransform, parent?: any) {
        var lines = this.make2DLines(deepCopy(ls), at, parent)
        this.setupUpdateCallbacks(ls, (v: any) => {
            this.sceneBuilder2D().scene?.removeElements(lines)
            lines = this.make2DLines(deepCopy(ls), at, parent)
        })
        return lines
    }

    add2DDataset(data: any, at: PointTransform): any[] {
        const elements: any[] = []
        const pointsToDraw = evaluateSpec(data.points)
        const trRadius = scaleOfTransform(at) * data.radius
        pointsToDraw.forEach((p: Point) => {
            elements.push(this.sceneBuilder2D().getScene().addCircle(at(p), trRadius, data.attributes))
        })
        return elements
    }

    addContinuousFunction(f: any, at: PointTransform): any {
        const func = evalInContext(f.function, { SceneData })
        const samples = linSpace(f.xDom[0], f.xDom[1], 250)
        const pl = {
            points: samples.map((p: number) => [p, func(p)]),
            attributes: f.attributes
        }
        return this.add2DPolyline(pl, at)

    }

    makeDiscreteFunction(parent: any, f: any, at: PointTransform): { parent: any, elements: any[] } {

        const elements: any[] = []

        f.samples = evaluateSpec(f.samples)
        if (f.hasOwnProperty('functions')) {
            f.functions = evaluateArrayOfSpecs(f.functions)
        } else {
            f.functions = [evalInContext(f.function, { SceneData })]
        }
        var colors = ColorPalette
        setPropertyIfNotExists(f, 'attributes', {})
        if (f.attributes.hasOwnProperty('fills')) {
            colors = f.attributes.fills
        } else {
            if (f.attributes.hasOwnProperty('fill')) {
                colors = [f.attributes.fill]
            }
        }
        const circleColor = (n: number) => colors[n % (colors.length)]
        f.functions.forEach((func: (x: number) => (number), k: number) => {
            const points = f.samples.map((p: number) => [p, func(p)])

            const circles = points.map((p: [number, number]) => {
                return {
                    radius: f.radius,
                    center: p
                }
            })
            const circleAttributes = shallowCopy(f.attributes)
            circleAttributes.fill = circleColor(k)
            setPropertyIfNotExists(circleAttributes, 'stroke-width', 0)
            const cs = { circles, attributes: circleAttributes }
            elements.push(...this.add2DCircles(cs, at, parent))
            if (f.stem) {
                const lineAttributes = shallowCopy(f['stem-attributes'])
                lineAttributes.stroke = circleColor(k)
                setPropertyIfNotExists(lineAttributes, 'stroke-width', 1)
                const lines = points.map((p: [number, number]) => {
                    return {
                        p1: [p[0], 0],
                        p2: p
                    }
                })
                const ls = { lines, attributes: lineAttributes }
                elements.push(...this.add2DLines(ls, at, parent))
            }
        })
        return {
            parent,
            elements
        }
    }

    addArrayToAxis(ar: any, at: PointTransform) {
        SceneData.arrays.level += 1
        SceneData.arrays.indices = SceneData.arrays.indices.concat([{ horizontal: 0, vertical: 0 }])
        setPropertyIfNotExists(ar, "horizontal", 1)
        setPropertyIfNotExists(ar, "vertical", 1)
        setPropertyIfNotExists(ar, "deltaHorizontal", 0)
        setPropertyIfNotExists(ar, "deltaVertical", 0)
        ar.deltaHorizontal = evaluateNumberSpec(ar.deltaHorizontal)
        ar.deltaVertical = evaluateNumberSpec(ar.deltaVertical)
        const scale = scaleOfTransform(at)
        var elements: any[] = []
        for (let h = 0; h < ar.horizontal; h++) {
            SceneData.arrays.indices[SceneData.arrays.level - 1].horizontal = h
            for (let v = 0; v < ar.vertical; v++) {
                SceneData.arrays.indices[SceneData.arrays.level - 1].vertical = v
                elements.push(this.sceneBuilder2D().startSubFigure(`translate(${h * ar.deltaHorizontal * scale},${v * ar.deltaVertical * scale})`))
                ar.elements.forEach((e: any) => {
                    this.addAxis2DContent(e, at)
                })
                this.sceneBuilder2D().endSubFigure()
            }
        }
        SceneData.arrays.indices.pop()
        SceneData.arrays.level -= 1
        return elements
    }

    addDiscreteFunction(f: any, at: PointTransform): any {
        var df = this.makeDiscreteFunction(this.sceneBuilder2D().getScene().currentCanvas, deepCopy(f), at)
        this.setupUpdateCallbacks(f, (v: any) => {
            this.sceneBuilder2D().getScene().removeElements(df.elements)
            df = this.makeDiscreteFunction(df.parent, deepCopy(f), at)
        })
        return df.elements
    }


    add3DPolyline(l: any, at: Point3DTransform, parentNode?: any) {
        l.points = evaluateArrayOfSpecs(l.points)

        this.setDefaultSolidAttributes(l, {})
        const points = l.points.map((p: Point3D) => at(ensurePoint3D(p)))
        return this.sceneBuilder2D().getScene().addPolyline(points, l.attributes, parentNode)
    }

    add3DPolylines(ls: any, at: Point3DTransform) {

        ls.polylines.forEach((l: any) => {
            transferAttributes(ls, l)
            this.add3DPolyline(l, at)
        })
    }

    add3DPolygon(l: any, at: Point3DTransform) {
        l.points = evaluateArrayOfSpecs(l.points)
        this.setDefaultSolidAttributes(l, {})
        const points = l.points.map((p: Point3D) => at(ensurePoint3D(p)))
        this.sceneBuilder2D().getScene().addPolygon(points, l.attributes)
    }

    add3DPolygons(ls: any, at: Point3DTransform) {

        ls.polygons.forEach((l: any) => {
            transferAttributes(ls, l)
            this.add3DPolygon(l, at)
        })
    }

    makeSpan2D(sp: any, at: Point3DTransform, parentNode?: any): any {
        var a1: Point3D
        const a1spec: Point3D | LA.Matrix = evaluateVectorSpec(sp.axis1)
        if (!Array.isArray(a1spec)) {
            a1 = LAColumnVector3DToPoint3D(a1spec)
        } else {
            a1 = a1spec as unknown as Point3D
        }
        var a2: Point3D
        const a2spec: Point3D | LA.Matrix = evaluateVectorSpec(sp.axis2)
        if (!Array.isArray(a2spec)) {
            a2 = LAColumnVector3DToPoint3D(a2spec)
        } else {
            a2 = a2spec as unknown as Point3D
        }
        const pl = {
            points: [
                addPoint3D(a1, a2),
                subPoint3D(a1, a2),
                subPoint3D(subPoint3D(ZeroPoint3D, a1), a2),
                subPoint3D(a2, a1)
            ],
            attributes: {
                fill: "#FEBFBF",
                "fill-opacity": 0.7,
                "stroke-width": 0
            }
        }
        return this.add3DPolyline(pl, at, parentNode)
    }

    addSpan2D(sp: any, at: Point3DTransform) {
        var span = this.makeSpan2D(deepCopy(sp), at)
        this.setupUpdateCallbacks(sp, (v: any) => {
            const parentNode = this.sceneBuilder2D().getScene().removeElement(span)
            span = this.makeSpan2D(deepCopy(sp), at, parentNode)
        })
        return span
    }


    makeDataset(data: any, at: Point3DTransform, viewDirection: Point3D, parentNode?: any): any[] {

        const elements: any[] = []

        const points = evaluatePoints3DSpec(data.points)
        // check oneSide

        var pointsToDraw: LA.Matrix[] | null = null

        if (data.oneSide) {
            const axis1 = evaluateVectorSpec(data.oneSide.axis1)
            const axis2 = evaluateVectorSpec(data.oneSide.axis2)
            const normal = perpendicularVector(axis1, axis2)
            normal.mul(((data.oneSide.side === "front") ? 1 : -1) * ((innerProduct(normal, ensureLAVector(viewDirection)) < 0) ? 1 : -1))
            // split points by normal, same side is front, other side is back
            const split = separateByPlane(points, normal)
            pointsToDraw = split.front
        } else {
            pointsToDraw = points
        }

        if (data.normals) {
            const dir = normalizeLA(evaluateVectorSpec(data.normals.direction))
            const lines = pointsToDraw.map(p => {
                return [
                    p,
                    LA.Matrix.sub(p, LA.Matrix.mul(dir, innerProduct(p, dir)))
                ]
            })
            lines.forEach(l => {
                elements.push(this.add3DLine({
                    p1: l[0],
                    p2: l[1],
                    attributes: data.normals.attributes
                }, at))
            })
        }

        if (pointsToDraw) {
            const trRadius = scaleOfTransform3D(at) * data.radius
            LAColumnVectors3DToPoints3D(pointsToDraw).forEach(p => {
                elements.push(this.sceneBuilder2D().getScene().addCircle(at(p), trRadius, data.attributes, parentNode))
            })
        }
        return elements
    }

    addDataset(data: any, at: Point3DTransform, viewDirection: Point3D): any[] {
        var ds = this.makeDataset(deepCopy(data), at, viewDirection)
        this.setupUpdateCallbacks(data, (v: any) => {
            const parentNode = this.sceneBuilder2D().getScene().removeElements(ds)
            ds = this.makeDataset(deepCopy(data), at, viewDirection, parentNode)
        })
        return ds
    }


    add3DEllipse(e: any, at: Point3DTransform) {
        setPropertyIfNotExists(e, "attributes", {})
        setPropertyIfNotExists(e.attributes, "stroke", "#000000")
        setPropertyIfNotExists(e.attributes, "stroke-width", 1.5)

        e['axis-major'] = evaluatePoints3DSpec(e['axis-major'])
        e['axis-minor'] = evaluatePoints3DSpec(e['axis-minor'])

        const axisMajor: Point3D = e['axis-major']
        const axisMinor: Point3D = e['axis-minor']
        const ellipsePoints3D = circlePoints().map(p =>
            addPoint3D(scalePoint3D(axisMajor, p[0]), scalePoint3D(axisMinor, p[1]))
        )
        const ellipsePoints = ellipsePoints3D.map(p => at(p))

        this.sceneBuilder2D().getScene().addPolyline(ellipsePoints, e.attributes)

    }

    makeSphere(e: any, at: Point3DTransform, parentNode?: any): any {
        setPropertyIfNotExists(e, "attributes", {})
        setPropertyIfNotExists(e.attributes, "stroke", "#000000")
        setPropertyIfNotExists(e.attributes, "stroke-width", 1.5)

        const center: Point3D = LAColumnVector3DToPoint3D(evaluateVectorSpec(e.center))
        const trRadius = scaleOfTransform3D(at) * e.radius
        return this.sceneBuilder2D().getScene().addCircle(at(center), trRadius, e.attributes, parentNode)
    }

    addSphere(s: any, at: Point3DTransform): any {
        var sphere = this.makeSphere(s, at)
        this.setupUpdateCallbacks(s, (value: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(sphere)
            sphere = this.makeSphere(s, at, parentNode)
        })
    }


    make3DLine(l: any, at: Point3DTransform, parentNode?: any) {
        const el = { ...l }
        const p1: Point3D = LAColumnVector3DToPoint3D(evaluateVectorSpec(l.p1))
        const p2: Point3D = LAColumnVector3DToPoint3D(evaluateVectorSpec(l.p2))

        setPropertyIfNotExists(el, "attributes", {})
        setPropertyIfNotExists(el.attributes, "stroke", "#000000")

        return this.sceneBuilder2D().addLine(at(p1), at(p2), el.attributes, false, false, parentNode)

    }

    add3DLine(l: any, at: Point3DTransform): any {
        var line = this.make3DLine(l, at)
        this.setupUpdateCallbacks(l, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(line)
            line = this.make3DLine(l, at, parentNode)
        })
        return line
    }

    add3DLines(ls: any, at: Point3DTransform) {

        ls.lines.forEach((l: any) => {
            transferAttributes(ls, l)
            this.cloneProperties(['updateOn'], ls, l)
            this.add3DLine(l, at)
        })
    }

    make3DVector(v: any, at: Point3DTransform, parentNode?: any) {
        const p1: Point3D = ensurePoint3D(evaluateVectorSpec(v.p1))
        const p2: Point3D = ensurePoint3D(evaluateVectorSpec(v.p2))

        setPropertyIfNotExists(v, "attributes", {})
        setPropertyIfNotExists(v.attributes, "stroke", "#000000")
        setPropertyIfNotExists(v.attributes, "stroke-width", 1.5)
        setPropertyIfNotExists(v.attributes, "fill", "none")

        if (v.attributes.hasOwnProperty('stroke')) {
            v.color = v.attributes.stroke
        } else {
            v.color = "#000000"
        }

        setPropertyIfNotExists(v.attributes, 'stroke-linecap', 'round')
        setPropertyIfNotExists(v.attributes, 'stroke-linejoin', 'round')

        const markerName = "red-arrow-" + (v.color.replace('#', ''))
        v.attributes["marker-end"] = `url(#${markerName})`

        this.sceneBuilder2D().getScene().addMarkerArrowheadOpenCurved(markerName, v.color)
        const vp = [at(p1), at(p2)]
        return this.sceneBuilder2D().getScene().addPolyline(vp, v.attributes, false, false, parentNode)


    }

    add3DVector(v: any, at: Point3DTransform): any {
        var vector = this.make3DVector(v, at)
        this.setupUpdateCallbacks(v, (vp: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(vector)
            vector = this.make3DVector(v, at, parentNode)
        })
        return vector
    }

    add3DVectors(vs: any, at: Point3DTransform) {
        vs.vectors.forEach((v: any) => {
            transferAttributes(vs, v)
            this.cloneProperties(['updateOn'], vs, v)
            this.add3DVector(v, at)
        })
    }


    addStandardBasis(b: any, at: Point3DTransform) {
        this.add3DVector({
            p1: [0, 0, 0],
            p2: [1, 0, 0],
            attributes: {
                stroke: "#ff0000"
            }
        }, at)
        this.add3DVector({
            p1: [0, 0, 0],
            p2: [0, 1, 0],
            attributes: {
                stroke: "#00ff00"
            }
        }, at)
        this.add3DVector({
            p1: [0, 0, 0],
            p2: [0, 0, 1],
            attributes: {
                stroke: "#0000ff"
            }
        }, at)
    }

    makeLine(l: any, parentNode?: any) {
        const el = { ...l }
        const p1 = evaluatePointSpec(el.p1)
        const p2 = evaluatePointSpec(el.p2)

        setPropertyIfNotExists(el, "attributes", {})
        setPropertyIfNotExists(el.attributes, "stroke", "#000000")

        return this.sceneBuilder2D().addLine(p1, p2, el.attributes, false, false, parentNode)
    }

    addLine(l: any) {
        var line = this.makeLine(l)
        this.setupUpdateCallbacks(l, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(line)
            line = this.makeLine(l, parentNode)
        })
        return line
    }


    makeLines(ls: any) {
        const elements: any[] = []
        ls = evaluateArrayOfSpecs(ls)
        ls.lines.forEach((l: any) => {
            this.cloneProperties(['attributes', 'updateOn'], ls, l)
            elements.push(this.addLine(l))
        })
        return elements
    }

    addLines(ls: any) {
        var lines = this.makeLines(deepCopy(ls))
        this.setupUpdateCallbacks(ls, (v: any) => {
            this.sceneBuilder2D().scene?.removeElements(lines)
            lines = this.makeLines(ls)
        })
    }

    makeFunctionPlot(fp: any, parentNode?: any): any[] {
        const elements: any[] = []
        fp.function = evaluateSpec(fp.function)
        if (!fp.hasOwnProperty('options')) {
            fp.options = {}
        }
        if (fp.options.hasOwnProperty('tickValuesX')) {
            fp.options.tickValuesX = evaluateSpec(fp.options.tickValuesX)
        }
        if (fp.options.hasOwnProperty('tickValuesY')) {
            fp.options.tickValuesY = evaluateSpec(fp.options.tickValuesY)
        }
        if (fp.hasOwnProperty('functions')) {
            fp.functions = evaluateSpec(fp.functions)
            fp.functions = evaluateArrayOfSpecs(fp.functions)
        }
        if (fp.hasOwnProperty('scatters')) {
            fp.scatters = evaluateArrayOfSpecs(fp.scatters)
        }
        if (fp.hasOwnProperty('scatter')) {
            fp.scatter = evaluateSpec(fp.scatter)
        }
        elements.push(...this.sceneBuilder2D().getScene().addFunctionPlot(fp, parentNode))
        if (fp.hasOwnProperty("content")) {
            const content = fp['content']
            const xOrigin = fp.origin[0]
            const yOrigin = fp.origin[1]
            const xScaling = fp.width / 180
            const yScaling = fp.height / (fp.yDom[0] - fp.yDom[1])

            const at: PointTransform = (p: [number, number]) => [p[0] * xScaling + xOrigin, p[1] * yScaling + yOrigin]
            content.forEach((c: any) => {
                elements.push(...this.addAxis2DContent(c, at))
            })
        }
        return elements
    }

    addFunctionPlot(fp: any): any[] {
        var fpNodeComponents: any[] = this.makeFunctionPlot(deepCopy(fp))
        const parentNode = fpNodeComponents[0]?.parentNode
        this.setupUpdateCallbacks(fp, (v: any) => {
            this.sceneBuilder2D().scene?.removeElements(fpNodeComponents)
            fpNodeComponents = this.makeFunctionPlot(deepCopy(fp), parentNode)
        })
        return fpNodeComponents
    }


    makeLatexText(latexTextSpec: any, parentNode?: any): any {
        const spec = cloneSpec(latexTextSpec)
        setPropertyIfNotExists(spec, 'scale', 1.0)
        setPropertyIfNotExists(spec, 'color', "#000000")
        spec.text = evaluateTextSpec(spec.text)
        spec.position = evaluatePointSpec(spec.position)
        return this.sceneBuilder2D().addLaTeX(spec.text, spec.position, spec.scale, spec.color, parentNode)
    }

    addLatexText(t: any) {
        var tNode = this.makeLatexText(t)
        this.setupUpdateCallbacks(t, (v: any) => {
            const parentNode = this.sceneBuilder2D().scene?.removeElement(tNode)
            tNode = this.makeLatexText(t, parentNode)
        })
    }

    addLatexTexts(latexTextsSpec: any) {
        latexTextsSpec.texts.forEach((ts: any) => {

            transferPropertiesIfNotExist(latexTextsSpec, ts, ['scale', 'color', 'updateOn'])
            this.addLatexText(ts)
        })
    }

    cloneProperties(lp: string[], o1: any, o2: any) {
        lp.forEach(p => {
            if (o1.hasOwnProperty(p)) {
                // maybe should be deep copy...
                o2[p] = o1[p]
            }
        })
    }

}

export function evaluateSpec(s: any): any {
    if (s === null) {
        return null
    }
    if (typeof s === 'string') {
        // assume it is a string to be evaluated
        const result = evalInContext(s, { SceneData })
        if (result === null) {
            throw new Error(`Evaluation of spec: "%{s}" failed`);
        }
        return result
    }
    return s
}

export function evaluatePointSpec(s: any): Point {

    if (typeof s === 'string') {
        // assume it is a string to be evaluated
        s = evalInContext(s, { SceneData })
    }
    return s
}

export function evaluateVectorSpec(s: any): LA.Matrix {


    if (typeof s === 'string') {
        // assume it is a string to be evaluated
        s = evalInContext(s, { SceneData })
    }
    // check if p1 or p2 are LA.Matrix values
    if (Array.isArray(s)) {
        return LA.Matrix.columnVector(s)
    }
    return s
}

export function evaluateArrayOfSpecs(s: any): any {
    if (s === null) {
        return null
    }
    if (typeof s === 'string') {
        // assume it is a string to be evaluated
        return evalInContext(s, { SceneData })
    }
    if (Array.isArray(s)) {
        // assume it is a string to be evaluated
        return s.map(v => {
            if (typeof v === 'string') {
                const result = evalInContext(v, { SceneData })
                if (result === null) {
                    throw new Error(`Evaluation of spec: "%{s}" failed`);
                }
                return result
            } else {
                return v
            }
        })
    }
    return s
}

export function evaluatePoints3DSpec(p: any): LA.Matrix[] {
    if (typeof p === 'string') {
        // assume it is a string to be evaluated
        p = evalInContext(p, { SceneData })
        if (p === null) {
            throw new Error(`Evaluation of spec: "%{s}" failed`);
        }
    }
    return p.map((p: any) => ensureLAVector(p))
}

export function evaluateTextSpec(t: string): string {
    if (t.length === 0) return t

    if (t.startsWith("eval:")) {
        // assume it is a string to be evaluated
        return evalInContext(t.substring(5), { SceneData })
    }
    return t
}


export function evaluateNumberSpec(n: any): number {
    if (typeof n === 'string') {
        // assume it is a string to be evaluated
        n = evalInContext(n, { SceneData })
    }
    return n
}

export function cloneSpec(spec: any): any {
    return JSON.parse(JSON.stringify(spec))
}

function getFillAttribute(o: any, defaultColor: string) {
    if (!o.attributes) {
        return defaultColor
    }
    if (!o.attributes.fill) {
        return defaultColor
    }
    return o.attributes.fill
}

function getStrokeAttribute(o: any, defaultColor: string) {
    if (!o.attributes) {
        return defaultColor
    }
    if (!o.attributes.stroke) {
        return defaultColor
    }
    return o.attributes.stroke
}

function hasStrokeAttribute(o: any): boolean {
    if (!o.attributes) {
        return false
    }
    return o.attributes.hasOwnProperty('stroke-dasharray')
}


