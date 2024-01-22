import { Point, Point3D, Point3DTransform, cameraProjection, subPoint3D, worldToCameraTransform } from "../math/geometry"
import { SvgCanvas } from "../svg/svg-support"
import { Matrix, Vector3 } from "../math/linear-algebra"

const axesLineWidth = "1.5"

export type Vector = [Point, Point]

/**
 * make 8 quadrant 3D axes.
 * @param svg
 * @param T
 * @param xDom
 * @param yDom
 * @param zDom
 */
export function axes3DAxes8Q(
    svg: SvgCanvas,
    T: Point3DTransform,
    xDom: [number, number],
    yDom: [number, number],
    zDom: [number, number],
    options: any
) {

    const axisStyle = {
        "stroke": "#000000",
        "stroke-width": axesLineWidth
    }

    if (options.showAxes) {
        svg.addLine(T([xDom[0], 0, 0]), T([xDom[1], 0, 0]), axisStyle)
        svg.addLine(T([0, yDom[0], 0]), T([0, yDom[1], 0]), axisStyle)
        svg.addLine(T([0, 0, zDom[0]]), T([0, 0, zDom[1]]), axisStyle)
    }
}

/**
 * make 8 quadrant 3D axes.
 * @param svg
 * @param T
 * @param xDom
 * @param yDom
 * @param zDom
 */
export function axes3DAxes1Q(
    svg: SvgCanvas,
    T: Point3DTransform,
    xDom: number,
    yDom: number,
    zDom: number,
    options: any
) {

    const axisStyle = {
        "stroke": "#000000",
        "stroke-width": axesLineWidth
    }

    if (options.showAxes) {
        svg.addLine(T([0, 0, 0]), T([xDom, 0, 0]), axisStyle)
        svg.addLine(T([0, 0, 0]), T([0, yDom, 0]), axisStyle)
        svg.addLine(T([0, 0, 0]), T([0, 0, zDom]), axisStyle)
    }
}


/**
 * make 8 quadrant 3D axes.
 * @param svg
 * @param xDom
 * @param yDom
 * @param zDom
 * @param center
 * @param scale
 * @returns
 */
export function axes3DIsometric8Q(
    svg: SvgCanvas,
    xDom: [number, number],
    yDom: [number, number],
    zDom: [number, number],
    center: [number, number],
    scale: number,
    options: any
): {axisTransform: Point3DTransform, viewDirection: Point3D} {

    const T: Point3DTransform = isometricTransform(center, scale)
    axes3DAxes8Q(svg, T, xDom, yDom, zDom, options)
    return {axisTransform: T, viewDirection: [-1, -1, -1]}
}

/**
 * make 8 quadrant 3D axes with camera perspective
 * @param svg
 * @param xDom
 * @param yDom
 * @param zDom
 * @param center
 * @param scale
 * @returns
 */
export function axes3DPerspective8Q(
    svg: SvgCanvas,
    xDom: [number, number],
    yDom: [number, number],
    zDom: [number, number],
    center: [number, number],
    scale: number,
    pos: Vector3,
    target: Vector3,
    fieldOfView: number,
    options: any
): {axisTransform: Point3DTransform, viewDirection: Point3D} {

    const T: Point3DTransform = perspectiveTransform(center, scale, pos, target, fieldOfView)
    axes3DAxes8Q(svg, T, xDom, yDom, zDom, options)
    return {axisTransform: T, viewDirection: subPoint3D(target, pos)}
}

/**
 * make 1 quadrant 3D axes with camera perspective
 * @param svg
 * @param xDom
 * @param yDom
 * @param zDom
 * @param center
 * @param scale
 * @returns
 */
export function axes3DPerspective1Q(
    svg: SvgCanvas,
    xDom: number,
    yDom: number,
    zDom: number,
    center: [number, number],
    scale: number,
    pos: Vector3,
    target: Vector3,
    fieldOfView: number,
    options: any
): {axisTransform: Point3DTransform, viewDirection: Point3D} {

    const T: Point3DTransform = perspectiveTransform(center, scale, pos, target, fieldOfView)
    axes3DAxes1Q(svg, T, xDom, yDom, zDom, options)
    return {axisTransform: T, viewDirection: subPoint3D(target, pos)}
}


/**
 * make 1 quadrant 3D axes.
 * @param svg
 * @param xDom
 * @param yDom
 * @param zDom
 * @param center
 * @param scale
 * @returns
 */
export function axes3DIsometric1Q(
    svg: SvgCanvas,
    xDom: number,
    yDom: number,
    zDom: number,
    center: [number, number],
    scale: number,
    options: any
): {axisTransform: Point3DTransform, viewDirection: Point3D} {

    const T: Point3DTransform = isometricTransform(center, scale)
    const axisStyle = {
        "stroke": "#000000",
        "stroke-width": axesLineWidth
    }

    if (options.showAxes) {
        svg.addLine(T([0, 0, 0]), T([xDom, 0, 0]), axisStyle)
        svg.addLine(T([0, 0, 0]), T([0, yDom, 0]), axisStyle)
        svg.addLine(T([0, 0, 0]), T([0, 0, zDom]), axisStyle)
    }
    return {axisTransform: T, viewDirection: [-1, -1, -1]}

}

function isometricTransform(center: [number, number], scale: number): Point3DTransform {
    return (p: Point3D) => {
        const ux = Math.cos(210 / 180 * Math.PI)
        const vx = Math.sin(210 / 180 * Math.PI)
        const uy = Math.cos(330 / 180 * Math.PI)
        const vy = Math.sin(330 / 180 * Math.PI)
        const uz = Math.cos(90 / 180 * Math.PI)
        const vz = Math.sin(90 / 180 * Math.PI)
        return [
            center[0] + scale * (p[0] * ux + p[1] * uy + p[2] * uz),
            center[1] - scale * (p[0] * vx + p[1] * vy + p[2] * vz)
        ]
    }
}

function perspectiveTransform(center: [number, number], scale: number, pos: Vector3, target: Vector3, fieldOfView: number): Point3DTransform {
    const TWC = worldToCameraTransform(pos, target)
    const TC = cameraProjection(fieldOfView)

    return (p: Point3D) => {
        const v = TWC(p)
        const q = TC(v)
        return [
            center[0]+scale*q[0],center[1]+scale*q[1]
        ]
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function multiplyPointMatrix(vIn: Vector3, M: Matrix)
{
    var vOut: Vector3 = [0,0,0]
    //out = in * M;
    vOut[0]   = vIn[0] * M[0][0] + vIn[1] * M[1][0] + vIn[2] * M[2][0] + /* vin[3] = 1 */ M[3][0]
    vOut[1]   = vIn[0] * M[0][1] + vIn[1] * M[1][1] + vIn[2] * M[2][1] + /* in.z = 1 */ M[3][1]
    vOut[2]   = vIn[0] * M[0][2] + vIn[1] * M[1][2] + vIn[2] * M[2][2] + /* in.z = 1 */ M[3][2]
    const w = vIn[0] * M[0][3] + vIn[1] * M[1][3] + vIn[2] * M[2][3] + /* in.z = 1 */ M[3][3]

    // normalize if w is different than 1 (convert from homogeneous to Cartesian coordinates)
    if (w !== 1) {
        vOut[0] /= w;
        vOut[1] /= w;
        vOut[2] /= w;
    }
    return vOut
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createProjectionMatrix(angleOfView: number, near: number, far: number): Matrix
{
    const M = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
    // set the basic projection matrix
    const scale = 1 / Math.tan(angleOfView * 0.5 * Math.PI / 180)
    M[0][0] = scale;  //scale the x coordinates of the projected point
    M[1][1] = scale;  //scale the y coordinates of the projected point
    M[2][2] = -far / (far - near);  //used to remap z to [0,1]
    M[3][2] = -far * near / (far - near);  //used to remap z [0,1]
    M[2][3] = -1;  //set w = -z
    M[3][3] = 0;
    return M
}