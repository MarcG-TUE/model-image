import * as LA from 'ml-matrix';
import { SingularValueDecomposition, Vector2, Vector3, crossProduct, ensureVector, innerProduct, normalizeVector, scaleVector, vectorNorm, vectorSubtract } from '../math/linear-algebra';
import { ComplexNumber, ComplexVector } from '../math/complex-numbers';
import { degreesToRadians } from '../math/utils';

export type Point = [number, number]
export type Points = Point[]
export type Point3D = [number, number, number]
export type Points3D = Point3D[]
export type PointTransform = (p: Point) => Point
export type PointsTransform = (p: Points) => Points
export const PointsTransformDefault:PointTransform = (p: Point)=>[p[0], p[1]]
export const ZeroPoint: Point = [0, 0]
export const ZeroPoint3D: Point3D = [0, 0, 0]


export type Point3DTransform = (p: Point3D) => Point
export type Points3DTransform = (p: Points3D) => Points

export function scaleOfTransform(t: PointTransform) {
    return (subPoint(t([1,0]), t([0,0])))[0]
}

export function scaleOfPolarTransform(t: PointTransform) {
    // maps [angle, radius] to [x,y]
    return (subPoint(t([0,1]), t([0,0])))[0]
}

export function nonUniformScaleOfTransform(t: PointTransform) {
    return subPoint(t([1,-1]), t([0,0]))
}

export function scaleOfTransform3D(t: Point3DTransform) {
    return length(subPoint(t([1,0,0]), t([0,0,0])))
}


export const Points3DTransformDefault:Point3DTransform = (p: Point3D)=>[p[0], p[1]]


export function addPoint(p1: Point, p2: Point): Point {
    return [p1[0]+p2[0], p1[1]+p2[1]]
}

export function addPoint3D(p1: Point3D, p2: Point3D): Point3D {
    return [p1[0]+p2[0], p1[1]+p2[1], p1[2]+p2[2]]
}

export function addPoints3D(p1: Points3D, p2: Points3D): Points3D {
    const n = Math.min(p1.length, p2.length)
    return Array.from({length: n}, (_, i) => addPoint3D(p1[i], p2[i]))
}


export function subPoint(p1: Point, p2: Point): Point {
    return [p1[0]-p2[0], p1[1]-p2[1]]
}

export function subPoint3D(p1: Point3D, p2: Point3D): Point3D {
    return [p1[0]-p2[0], p1[1]-p2[1], p1[2]-p2[2]]
}

export function length(p: Point): number {
    return Math.sqrt(p[0] * p[0] + p[1] * p[1])
}

export function angleOf(p: Point): number {
    return Math.atan2(p[1], p[0])/Math.PI * 180.0
}

export function normalize(p: Point): Point {
    const l = length(p)
    return scalePoint(p, 1/l)
}

export function normalizeLA(p: LA.Matrix): LA.Matrix {
    const l = p.norm('frobenius')
    return LA.Matrix.mul(p, 1.0/l)
}



export function offset(points: Points, offset: Point): Points {
    return points.map(p=>addPoint(p, offset))
}

export function scalePoint(p: Point, s: number): Point {
    return [p[0]*s, p[1]*s]
}

export function scalePoints(points: Points, s: number): Points {
    return points.map(p=>scalePoint(p, s))
}

export function clipPoints(points: Points, xRange: [number,number], yRange: [number,number]): Points {
    return points.filter(p=>(xRange[0]<=p[0] && p[0]<=xRange[1])).filter(p=>(yRange[0]<=p[1] && p[1]<=yRange[1]))
}


export function scalePoint3D(p: Point3D, s: number): Point3D {
    p = ensurePoint3D(p)
    return [p[0]*s, p[1]*s, p[2]*s]
}

export function scalePoints3D(points: Points3D, s: number): Points3D {
    return points.map(p=>scalePoint3D(p, s))
}



/**
 *
 * @param p point
 * @param angle positive rotation angle in degrees
 * @returns rotated point
 */
export function rotatePoint(p: Point, angle: number, radians: boolean = false): Point {
    const alpha = radians?angle:degreesToRadians(angle)
    const c = Math.cos(alpha)
    const s = Math.sin(alpha)
    return [
        p[0]*c - p[1] *s,
        p[0]*s + p[1]*c
    ]
}


/**
 *
 * @param p point
 * @returns angle of point p wrt positive x-axis in radians
 */
export function angleOfPoint(p: Point): number {
    return Math.atan2(p[1],p[0])
}

export function rotatePoints(points: Points, angle: number): Points {
    const alpha = degreesToRadians(angle)
    const c = Math.cos(alpha)
    const s = Math.sin(alpha)
    return points.map(p=>[
        p[0]*c - p[1] *s,
        p[0]*s + p[1]*c
    ])
}

export function toPointsTransform(t: PointTransform): PointsTransform {
    return (pl: Points) => pl.map(p=>t(p))
}

export function toPoints3DTransform(t: Point3DTransform): Points3DTransform {
    return (pl: Points3D) => pl.map(p=>t(p))
}

export function parabola(radius: number, steps: number): Points {
    var result: Points = []
    for (let n = 0; n < steps; n++) {
        const x = -radius + (n/(steps-1)) * 2 * radius
        const y = x*x
        result.push([x, y])
    }
    return result
}

export function circlePoints(steps: number=50): Points {
    var result: Points = []
    for (let n = 0; n < steps; n++) {
        const alpha = n/(steps-1)*2*Math.PI
        result.push([Math.cos(alpha), Math.sin(alpha)])
    }
    return result
}

function circlePointVectors(radius: number, nrSegments: number) {
    var result = []
    for (let k = 0; k < nrSegments; k++) {
        const phi = k / nrSegments * 2 * Math.PI
        result.push(LA.Matrix.columnVector([
            0,
            radius*Math.cos(phi),
            radius*Math.sin(phi),
        ]))

    }
    return result
}

export function shortenStart(p1: Point, p2: Point, dist: number): Point {
    const dir = normalize(subPoint(p2, p1))
    return addPoint(p1, scalePoint(dir, dist))
}

export function shortenEnd(p1: Point, p2: Point, dist: number): Point {
    const dir = normalize(subPoint(p2, p1))
    return subPoint(p2, scalePoint(dir, dist))
}

export function createPlane(normal: LA.Matrix, up: LA.Matrix, size: number) {

    // normalize the vectors
    normal = normal.mul(1.0 / normal.norm("frobenius"))
    up = up.mul(1.0 / up.norm("frobenius"))

    // v = u - u^H n * n
    // h = v x n

    const vert = LA.Matrix.sub(up, normal.mmul(up.transpose().mmul(normal)))

    const hor = perpendicularVector(normal, vert)

    vert.mul(size)
    hor.mul(size)

    var positions = [
        LA.Matrix.sub(LA.Matrix.sub(LA.Matrix.zeros(3,1), hor), vert),// bottom left
        LA.Matrix.sub(hor, vert),// bottom right
        LA.Matrix.add(hor, vert),// top right
        LA.Matrix.sub(vert, hor),//top left
    ]
    var indices = [[0, 1, 3], [3, 1, 2]]

    return {vertices: positions, faces: indices}
}



/**
 *
 * @param transform transformation matrix for the orientation
 * @param innerWidth arrow thickness
 * @param outerWidth arrow head thickness
 * @param tipLength length of the arrow tip
 * @param nrSegments number of segments around the arrow
 * @returns a Babylon Mesh
 */
export function createArrow(transform: LA.Matrix, innerWidth: number, outerWidth: number, tipLength: number, nrSegments: number, length: number = 1.0, parent?:any) {

    var {points, faces} = standardArrow(innerWidth, outerWidth, tipLength, nrSegments, length)

    points = points.map(p=> transform.mmul(p))

    return {points, faces}
}

/**
 * Create a 'standard' arrow along the x-axis and right-side-out normals for a right-handed coordinate system
 * @param innerWidth arrow thickness
 * @param outerWidth arrow head thickness
 * @param tipLength length of the arrow tip
 * @param nrSegments number of segments around the arrow
 * @param length length of the arrow
 * @returns points and faces of the arrow
 */
export function standardArrow(innerWidth: number, outerWidth: number, tipLength: number, nrSegments: number, length: number = 1.0) {

    var points: LA.Matrix[] = []

    // center point at the base
    points.push(LA.Matrix.columnVector([0,0,0]))
    const baseCenterIndex = 0

    // construct points at the base
    points.push(...(circlePointVectors(innerWidth, nrSegments) as unknown as LA.Matrix[]))
    const baseRadiusIndex = (k: number) => k+1

    // construct inner points under the tip
    const innerPointsOffSet = LA.Matrix.columnVector([length-tipLength,0,0])
    points.push(...circlePointVectors(innerWidth, nrSegments).map(p => LA.Matrix.add(p, innerPointsOffSet)))
    const topInnerRadiusIndex = (k: number) => k+1+nrSegments

    // construct outer points under the tip
    const outerPointsOffSet = LA.Matrix.columnVector([length-tipLength,0,0])
    points.push(...circlePointVectors(outerWidth, nrSegments).map(p => LA.Matrix.add(p, outerPointsOffSet)))
    const topOuterRadiusIndex = (k: number) => k+1+2*nrSegments

    // tip point
    points.push(LA.Matrix.columnVector([length,0,0]))
    const tipIndex = 1 + 3 * nrSegments

    var faces = []

    // construct base faces
    for (let k = 0; k < nrSegments; k++) {
        faces.push([
            baseCenterIndex,
            baseRadiusIndex((k+nrSegments-1)%nrSegments),
            baseRadiusIndex(k),
        ])
    }

    // construct outer faces
    for (let k = 0; k < nrSegments; k++) {
        faces.push([
            baseRadiusIndex(k),
            topInnerRadiusIndex(k),
            baseRadiusIndex((k+1)%nrSegments),
        ])
        faces.push([
            baseRadiusIndex((k+1)%nrSegments),
            topInnerRadiusIndex(k),
            topInnerRadiusIndex((k+1)%nrSegments),
        ])
    }

    // construct base of the tip
    for (let k = 0; k < nrSegments; k++) {
        faces.push([
            topInnerRadiusIndex(k),
            topOuterRadiusIndex(k),
            topInnerRadiusIndex((k+1)%nrSegments),
        ])
        faces.push([
            topInnerRadiusIndex((k+1)%nrSegments),
            topOuterRadiusIndex(k),
            topOuterRadiusIndex((k+1)%nrSegments),
        ])
    }

    // construct sides of the tip
    for (let k = 0; k < nrSegments; k++) {
        faces.push([
            topOuterRadiusIndex(k),
            tipIndex,
            topOuterRadiusIndex((k+1)%nrSegments),
        ])
    }

    return {points, faces}
}

export function makeBasis(alpha: number, beta: number): LA.Matrix {
    const alphaRad = degreesToRadians(alpha)
    const betaRad = degreesToRadians(beta)
    const ca = Math.cos(alphaRad)
    const sa = Math.sin(alphaRad)
    const cb = Math.cos(betaRad)
    const sb = Math.sin(betaRad)
    const RA = new LA.Matrix([
        [ca , sa, 0],
        [-sa, ca, 0],
        [0  , 0 , 1],
      ]);
    const RB = new LA.Matrix([
        [cb , 0, sb],
        [0  , 1, 0 ],
        [-sb, 0, cb],
      ]);
    return RB.mmul(RA)
}

export function LAColumnVector3DToPoint3D(v: LA.Matrix): Point3D {
    return [v.get(0,0), v.get(1,0), v.get(2,0)]
}

export function LAColumnVectorToPoint(v: LA.Matrix): Point {
    return [v.get(0,0), v.get(1,0)]
}

export function LAColumnVectors3DToPoints3D(vs: LA.Matrix[]): Points3D {
    return vs.map(v=>LAColumnVector3DToPoint3D(v))
}

export function ensureLAVector(v: Point3D|Vector3|LA.Matrix): LA.Matrix {
    if (Array.isArray(v)) {
        v = LA.Matrix.columnVector(v)
    }
    return v
}

export function ensurePoint3D(v: Point3D|LA.Matrix): Point3D {
    if (Array.isArray(v)) {
        return v
    }
    return LAColumnVector3DToPoint3D(v)
}

export function ensurePoint(v: Point|LA.Matrix): Point {
    if (Array.isArray(v)) {
        return v
    }
    return LAColumnVectorToPoint(v)
}

export function vectorInBasis(B: LA.Matrix, v: Point3D|LA.Matrix): Point3D {
    v = ensureLAVector(v)
    const w = B.mmul(v)
    return LAColumnVector3DToPoint3D(w)
}

export function projectOntoSpan(v: Point3D|LA.Matrix, a1: Point3D|LA.Matrix, a2: Point3D|LA.Matrix): Point3D {
    const vm: LA.Matrix = ensureLAVector(v)
    const a1m = ensureLAVector(a1)
    const a2m = ensureLAVector(a2)

    var A: LA.Matrix = new LA.Matrix([
        [a1m.get(0,0), a2m.get(0,0), 0],
        [a1m.get(1,0), a2m.get(1,0), 0],
        [a1m.get(2,0), a2m.get(2,0), 1]
    ])

    var Q = new LA.QrDecomposition(A).orthogonalMatrix;
    var U: LA.Matrix = new LA.Matrix([
        [Q.get(0,0), Q.get(0,1)],
        [Q.get(1,0), Q.get(1,1)],
        [Q.get(2,0), Q.get(2,1)]
    ])

    return LAColumnVector3DToPoint3D(U.mmul(U.transpose().mmul(vm)))
}

export function perpendicularVector(v1: LA.Matrix, v2: LA.Matrix) {
    // [a b c] x [x y z]
    // [b*z - c*y; c*x-a*z; a*y-b*x]

    v1 = ensureLAVector(v1)
    v2 = ensureLAVector(v2)

    return LA.Matrix.columnVector([
        v1.get(1,0)*v2.get(2,0) - v1.get(2,0)*v2.get(1,0),
        v1.get(2,0)*v2.get(0,0) - v1.get(0,0)*v2.get(2,0),
        v1.get(0,0)*v2.get(1,0) - v1.get(1,0)*v2.get(0,0)
    ])
}

/**
 * Split a list of points (curve) into a list of lists of points such that the individual lists are all on the same side of the plane going through the origin with the given normal vector.
 * @param points List of LA column vector points
 * @param normal Normal vector of the plane to split on
 */
export function splitByPlane(points: LA.Matrix[], normal: LA.Matrix): {segments: LA.Matrix[][], sides: boolean[]} {

    function computeIntersect(p1: LA.Matrix, p2: LA.Matrix, normal: LA.Matrix): LA.Matrix {
        const L1 = innerProduct(p1, normal)
        const L2 = innerProduct(p2, normal)
        const f = L2/(L1+L2)
        const i1 = LA.Matrix.mul(p1, f)
        const i2 = LA.Matrix.mul(p2, (1-f))
        return LA.Matrix.add(i1, i2)
    }

    const nt = normal.transpose()
    var segments: LA.Matrix[][] = []
    var sides: boolean[] = []
    var prevPoint = points[0]
    var currentSide: boolean = (nt.mmul(prevPoint)).get(0,0) > 0
    var currentList: LA.Matrix[] = []
    currentList.push(prevPoint)
    points.forEach(p=>{
        var side: boolean = (nt.mmul(p)).get(0,0) > 0
        if (side === currentSide) {
            currentList.push(p)
        } else {
            // We have changed sides. Compute intersection, finish previous list and start new list
            const intersect = computeIntersect(prevPoint, p, normal)
            currentList.push(intersect)
            segments.push(currentList)
            sides.push(side)
            currentList = []
            currentList.push(p)
            currentSide = side
        }
        prevPoint = p
    })

    return {segments, sides}
}

export function separateByPlane(points: LA.Matrix[], normal: LA.Matrix): {front: LA.Matrix[], back:LA.Matrix[]} {
    const front: LA.Matrix[] = []
    const back: LA.Matrix[] = []

    points.forEach(p => {
        if (innerProduct(normal, p)>0) {
            front.push(p)
        } else {
            back.push(p)
        }
    })

    return {front, back}
}

export function RegularPolygon(sides: number, radius: number, offset=[0,0]) {
    return Array.from({length: sides}, (_, i) => [radius*Math.cos(i/sides*2*Math.PI)+offset[0], radius*Math.sin(i/sides*2*Math.PI)+offset[1]])
}

export function translationMatrix(delta: Vector3): LA.Matrix {
    return new LA.Matrix([
        [1,0,0,delta[0]],
        [0,1,0,delta[1]],
        [0,0,1,delta[2]],
        [0,0,0, 1]
    ])
}

export function rotationMatrix4(axis: Vector3, angle: number): LA.Matrix {
    // create a unitary basis with axis as the first axis
    const result = new LA.Matrix(4,4)
    const R = rotationMatrix(axis, angle)
    result.setSubMatrix(R, 0, 0)
    result.set(3,3,1)
    return result
}

export function rotationMatrix(axis: Vector3, angle: number): LA.Matrix {
    // create a unitary basis with axis as the first axis

    const normalizedAxis: Vector3 = normalizeVector(axis) as Vector3

    const svd = SingularValueDecomposition([normalizedAxis,[0,0,0],[0,0,0]])

    // ensure the basis is oriented right
    var bv1 = ensureVector(svd.leftSingularVectors.getColumnVector(0))
    const ip1 = innerProduct(bv1, ensureLAVector(normalizedAxis))
    if (ip1 < 0) {
        bv1 = scaleVector(bv1, -1)
    }

    // ensure other two basis vectors have positive orientation
    const bv2 = ensureVector(svd.leftSingularVectors.getColumnVector(1))
    var  bv3 = ensureVector(svd.leftSingularVectors.getColumnVector(2))

    // check right handedness
    if (innerProduct(crossProduct(bv2, bv3), bv1) < 0) {
        bv3 = scaleVector(bv3, -1)
    }

    const VH = new LA.Matrix([bv1, bv2, bv3])
    const V = new LA.Matrix(3,3)
    V.setColumn(0, bv1)
    V.setColumn(1, bv2)
    V.setColumn(2, bv3)
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const R = new LA.Matrix([
        [1, 0, 0],
        [0, c, -s],
        [0, s, c]
    ])
    return V.mmul(R.mmul(VH))
}


/**
 *
 * @param fov
 * @returns camera projection. 3D point,
 * pos x points away from camera
 * neg y points to the right (pos x on screen)
 * pos z points up (neg y on screen)
 */
export function cameraProjection(fov: number): (p: Vector3)=>Vector2 {
    const t = Math.tan(fov/180*Math.PI/2)
    const D = 1.0 / (2 * t)

    return (v: Vector3) => [-D*v[1]/v[0], -D*v[2]/v[0]]
}


/**
 *
 * @param pos
 * @param target
 * @returns a transformation that transforms world coordinates into coordinates relative to the camera at position pos, pointing at target and oriented up (Z-)ward.
 */
export function worldToCameraTransform(pos: Vector3, target: Vector3): (p: Vector3)=>Vector3 {
    const dif = vectorSubtract(target, pos)
    const dir = normalizeVector(dif)
    const horizontalAngle = Math.atan2(dir[1], dir[0])
    const verticalAngle = Math.atan2(dir[2], vectorNorm([dir[0],dir[1],0]))

    // transform world coordinates to camera coordinates
    // - relative to camera pos
    const MTranslation = translationMatrix(vectorSubtract([0,0,0],pos) as Vector3)
    const MHRotation = rotationMatrix4([0,0,1], -horizontalAngle)
    const MVRotation = rotationMatrix4([0,1,0], verticalAngle)
    const W2C = MVRotation.mmul(MHRotation.mmul(MTranslation))

    return (p: Vector3) => {
        const v = W2C.mmul(LA.Matrix.columnVector([p[0], p[1], p[2], 1]))
        const w: Vector3 = [v.get(0,0), v.get(1,0), v.get(2,0)]
        return w
    }
}

export function cameraMatrix(pos: Vector3, target: Vector3): LA.Matrix{
    const dif = vectorSubtract(target, pos)
    const dir = normalizeVector(dif)
    const horizontalAngle = Math.atan2(dir[1], dir[0])
    const verticalAngle = Math.atan2(dir[2], vectorNorm([dir[0],dir[1],0]))

    // transform world coordinates to camera coordinates
    // - relative to camera pos
    const MTranslation = translationMatrix(vectorSubtract([0,0,0],pos) as Vector3)

    const MHRotation = rotationMatrix4([0,0,1], -horizontalAngle)
    const MVRotation = rotationMatrix4([0,1,0], verticalAngle)
    const W2C = MVRotation.mmul(MHRotation.mmul(MTranslation))

    return W2C
}


/**
 * Project a complex vector of length at least three, of complex numbers to x,y,z, values for visualization
 * @param v a vector of complex numbers
 * @returns x,y,z coordinates of projection
 */
export function projectForVisualization(v: Array<ComplexNumber>) {
    return {
        x: v[1][0],
        y: v[2][0],
        z: v[3][1]
    }
}

export function projectResponseVectorLA(v: ComplexVector) {
    const p = projectForVisualization(v)
    return LA.Matrix.columnVector([p.x, p.y, p.z])
}

/**
 *
 * @param v Array of complex valued points (?)
 * @returns Array of BBL.Vector3 points projecting the multi-dimensional points for 3D visualization
 */
export function projectResponseVector(v: Array<ComplexNumber>) {
    const p = projectForVisualization(v)
    return LA.Matrix.columnVector([p.x, p.y, p.z])
}

