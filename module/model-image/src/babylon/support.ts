import * as BBL from "babylonjs"
import * as LA from 'ml-matrix';
import { determinant } from "ml-matrix";
import { createArrow, createPlane, perpendicularVector } from "../math/geometry"
import { TArrowOptions } from "./settings"
import { SceneBuilder } from "../scene-builder/scene-builder-svg"


export function ColumnVectorToBBLVector3(v: LA.Matrix): BBL.Vector3 {
    return new BBL.Vector3(v.get(0, 0), v.get(1, 0), v.get(2, 0))
}

export function CSSColorToBBLColor4(c: string): BBL.Color4 {
    const r = parseInt(c.substring(1, 3), 16)
    const g = parseInt(c.substring(3, 5), 16)
    const b = parseInt(c.substring(5, 7), 16)
    return new BBL.Color4(r, g, b, 1)
}


export class SceneBuilder3D extends SceneBuilder {

    scene: BBL.Scene | undefined
    root: BBL.TransformNode | undefined
    _canvas: HTMLCanvasElement | null = null
    _engine: BBL.Engine | null = null

    createStandardScene(engine: BBL.Engine, canvas: HTMLCanvasElement) {
        this._canvas = canvas
        this._engine = engine
        this.scene = new BBL.Scene(this._engine);
        this.scene.clearColor = new BBL.Color4(1, 1, 1, 1);

        // create root node for right-handed axes
        this.root = new BBL.TransformNode("root");
        const transf = BBL.Matrix.FromArray([
            1, 0, 0, 0,
            0, 0, 1, 0,
            0, 1, 0, 0,
            0, 0, 0, 1
        ])
        this.root.setPreTransformMatrix(transf)

        this._createCamera()
        this._createLighting()
    }

    _setOptionalParent(obj: any, parent: BBL.Node | undefined) {
        if (parent) {
            obj.parent = parent
        } else {
            if (this.root) {
                obj.parent = this.root
            }
        }
    }

    addLine(startPoint: LA.Matrix, endPoint: LA.Matrix, color: BBL.Color4, dashed: boolean, parent?: BBL.Node) {
        if (!color) {
            color = new BBL.Color4(0, 0, 0, 1)
        }
        return this.addPolyline([startPoint, endPoint], color, dashed, parent)
    }

    addSphere(center: LA.Matrix, radius: number, color: BBL.Color4, parent?: BBL.Node) {
        const sphere = BBL.MeshBuilder.CreateSphere("sphere", {
            diameter: 2 * radius
        }, this.scene)

        sphere.position = new BBL.Vector3(center.get(0, 0), center.get(1, 0), center.get(2, 0))
        var material = new BBL.StandardMaterial("sphere");
        material.alpha = color.a;
        material.diffuseColor = new BBL.Color3(color.r, color.g, color.b);
        material.backFaceCulling = false;
        sphere.material = material;

        this._setOptionalParent(sphere, parent)
        return sphere
    }

    addPolyline(points: LA.Matrix[], color: BBL.Color4, dashed: boolean, parent?: BBL.Node) {
        const bblPoints = points.map(p => ColumnVectorToBBLVector3(p))
        const colors: BBL.Color4[] = Array(points.length).fill(color)

        var lines: BBL.Mesh | null = null
        if (!dashed) {
            lines = BBL.MeshBuilder.CreateLines("lines", {
                points: bblPoints, colors
            })
        } else {
            const dashedLines = BBL.MeshBuilder.CreateDashedLines("lines", {
                points: bblPoints,
                dashNb: 4
            })
            dashedLines.color = new BBL.Color3(color.r, color.g, color.b)
            lines = dashedLines
        }
        this._setOptionalParent(lines, parent)
        return lines
    }


    addMesh(vertices: LA.Matrix[], faces: number[][], color: BBL.Color4, parent?: BBL.Node) {

        var customMesh = new BBL.Mesh("custom");
        var vertexData = new BBL.VertexData();

        var flatPositions: number[] = vertices.reduce(
            (result: number[], a) => {
                return result.concat(
                    [a.get(0, 0),
                    a.get(1, 0),
                    a.get(2, 0)]
                )
            },
            [])

        var flatFaces = faces.reduce(
            (result: number[], a) => result.concat(a),
            [])


        vertexData.positions = flatPositions
        vertexData.indices = flatFaces;

        vertexData.applyToMesh(customMesh);
        var material = new BBL.StandardMaterial("mesh");
        material.alpha = color.a;
        material.diffuseColor = new BBL.Color3(color.r, color.g, color.b);
        material.backFaceCulling = false;
        customMesh.material = material;
        this._setOptionalParent(customMesh, parent)
        return customMesh
    }

    addSpan2D(a1: LA.Matrix, a2: LA.Matrix, color?: BBL.Color4, parent?: BBL.Node) {

        const per = perpendicularVector(a1, a2)

        const p = createPlane(per, a1, 2)

        if (!color) {
            color = new BBL.Color4(0.996, 0.749, 0.749, 0.8)
        }
        return this.addMesh(p.vertices, p.faces, color, parent)
    }


    /**
     *
     * @param direction column vector for the arrow vector
     * @param options arrow options
     * @returns a Babylon Mesh
     */
    addDirectedArrow(startPoint: LA.Matrix, endPoint: LA.Matrix, options: TArrowOptions, color: BBL.Color4, parent?: BBL.Node) {

        const direction = endPoint.subtract(startPoint)

        // create a basis for the transformation
        // normalize the direction vector to length one
        const length = direction.norm("frobenius")
        const normDir = LA.Matrix.mul(direction, 1 / length)

        // create an orthonormal basis with the arrow direction as the first dimension
        var A = LA.Matrix.zeros(3, 3);
        A.setColumn(0, normDir.to1DArray())
        var QR = new LA.QrDecomposition(A);
        var Q = QR.orthogonalMatrix;

        // Q my either have normDir or -normDir as the first column
        // make sure it is normDir
        var v = Q.getColumnVector(0)
        const good: boolean = (v.transpose().mmul(normDir)).get(0, 0) > 0
        if (!good) {
            const Correction = new LA.Matrix([[-1, 0, 0], [0, 1, 0], [0, 0, 1]])
            Q = Q.mmul(Correction)
        }

        // ensure the determinant of the final transform is positive so the faces are the right side out
        if (determinant(Q) < 0) {
            const Correction = new LA.Matrix([[1, 0, 0], [0, -1, 0], [0, 0, 1]])
            Q = Q.mmul(Correction)
        }

        // create a standard arrow in the given basis
        var { points, faces } = createArrow(Q, options.innerWidth, options.outerWidth, options.tipLength, options.nrSegments, length, parent)

        points = points.map(p => p.add(startPoint))

        return this.addMesh(points, faces, color, parent)

    }

    addTube(points: LA.Matrix[], radius: number, color: BBL.Color3, parent?: BBL.Node) {
        const pointsBBL = points.map(p => ColumnVectorToBBLVector3(p))
        const options = {
            path: pointsBBL,
            radius,
            updatable: false
        }
        let tube = BBL.MeshBuilder.CreateTube("tube", options, this.scene)
        var mMaterial = new BBL.StandardMaterial("tube");
        mMaterial.diffuseColor = color
        tube.material = mMaterial
        this._setOptionalParent(tube, parent)
        return tube
    }


    _createCamera() {
        const alpha = Math.PI / 4;
        const beta = Math.PI / 3;
        const radius = 4;
        const target = new BBL.Vector3(0, 0, 0);
        const camera = new BBL.ArcRotateCamera("Camera", alpha, beta, radius, target, this.scene);
        camera.attachControl(this._canvas, true);
    }

    _createLighting() {
        if (!this.scene) return
        new BBL.HemisphericLight("light", new BBL.Vector3(1, 1, 1), this.scene);
    }

}