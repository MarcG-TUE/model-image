
export {Config} from "./config/config"
export type {TModelImageConfig} from "./config/config"

export {JSonSceneParser2D} from "./parsing/json-parsing"
export { Parameter } from "./parameters/parameters"

export type { TDOMConfig } from "./utils/dom"
export { DOMConfig } from "./utils/dom"


// math/complex-numbers
export { ComplexMatrix, ComplexNumber, ComplexVector, cAbs, cAddMatrices, cConjugateMatrixProduct, cConjugateTransposeMatrix, cFrobeniusNormSquare, cIdentityMatrix, cInnerProduct, cMultiplyMatrices, cScaleMatrix, cSubtractMatrices, pseudoInverse, sizeOfMatrix, cAdd, cExp, cMul } from "./math/complex-numbers"

// math geometry
export { Point3D, Points3D, Point, Points, addPoint, offset, angleOfPoint, rotatePoint, LAColumnVector3DToPoint3D, Point3DTransform, PointTransform, ensureLAVector, perpendicularVector, splitByPlane, toPoints3DTransform, PointsTransform, offset as offsetPoints, parabola, rotatePoints, scalePoints } from "./math/geometry"


// math linear-algebra
export { Vector2, innerProduct } from "./math/linear-algebra"

// math numerical methods
export { randomFloat } from "./math/numerical-methods"

// math utils
export { degreesToRadians } from "./math/utils"

// graphics/clipart
export { addFromFile } from "./graphics/clipart"

// svg/svg-support
export { SvgCanvas } from "./svg/svg-support"

// babylon settings
export { DefaultArrow, NumberOfManifoldPoints } from "./babylon/settings"

// parsing json-parsing
export { JSonSceneParser2D as JsonSceneParser2D, JSonSceneParser3D as JsonSceneParser3D, SceneData, cloneSpec, evaluateArrayOfSpecs, evaluateNumberSpec, evaluateSpec, evaluateVectorSpec, updateSceneData } from "./parsing/json-parsing"

// scene builder
export { SceneBuilder, SceneBuilder2D } from './scene-builder/scene-builder-svg'

// utils utils
export { deepCopy, indirectEval, setPropertyIfNotExists } from "./utils/utils"

// utils random
export { rnGen } from "./utils/random"

// svg function-plot
export { addPlot, addPlotPolar } from "./svg/function-plot"
