import * as LA from 'ml-matrix'

export type Vector=number[]
export type Vector2=[number,number]
export type Vector3=[number,number,number]
// matrix is a list of column vectors
export type Matrix=Vector[]

function ensureLAMatrix(A: LA.Matrix|Matrix){
    if (Array.isArray(A)) {
        var M = new LA.Matrix(A)
        M = M.transpose()
    } else {
        M=A
    }
    return M
}

function ensureLAColumnVector(x: LA.Matrix|Vector){
    if (Array.isArray(x)) {
        var v = LA.Matrix.columnVector(x)
    } else {
        v=x
    }
    return v
}

export function ensureVector(x: LA.Matrix|Vector): Vector {
    if (Array.isArray(x)) {
        var v=x
    } else {
        v = x.to1DArray()
    }
    return v
}

export function vectorNorm(x: LA.Matrix|Vector): number {
    const v = ensureVector(x)
    return Math.sqrt(v.reduce((sum, val)=>sum+val*val, 0))
}

export function vectorSubtract(v1: Vector, v2: Vector): Vector {
    if (v1.length !== v2.length) {
        throw new Error("Vectors are of unequal size in vectorSubtract")
    }
    return v1.map((v,k)=>v-v2[k])
}

export function innerProduct(a: LA.Matrix|Vector, b: LA.Matrix|Vector) {
    const v1 = ensureVector(a)
    const v2 = ensureVector(b)
    if (v1.length !== v2.length) {
        throw new Error("Vectors are of unequal size in innerProduct")
    }
    return v1.reduce((s, v, k)=> s + v*v2[k], 0)
}

export function crossProduct(a: LA.Matrix|Vector, b: LA.Matrix|Vector): Vector {
    const v1 = ensureVector(a)
    const v2 = ensureVector(b)
    if (v1.length !==3 || v2.length !== 3) {
        throw new Error("Vectors should be of length 3 in cross product.")
    }
    return [
            v1[1]*v2[2]-v1[2]*v2[1],
            v1[2]*v2[0]-v1[0]*v2[2],
            v1[0]*v2[1]-v1[1]*v2[0]
        ]
}

export function normalizeVector(x: LA.Matrix|Vector): Vector {
    const v = ensureVector(x)
    const n: number = vectorNorm(v)
    return v.map(a=>a/n)
}

export function scaleVector(x: LA.Matrix|Vector, s: number): Vector {
    const v = ensureVector(x)
    return v.map(a=>a*s)
}


export function MatrixInverse(A: LA.Matrix|Matrix) {
    const M = ensureLAMatrix(A)
    return LA.inverse(M)
}

export function MatrixProduct(A: LA.Matrix|Matrix, B: LA.Matrix|Matrix) {
    const M = ensureLAMatrix(A)
    const N = ensureLAMatrix(B)
    return M.mmul(N)
}

export function MatrixVectorProduct(A: LA.Matrix|Matrix, x: LA.Matrix|Vector) {
    const M = ensureLAMatrix(A)
    const v = ensureLAColumnVector(x)
    return M.mmul(v)
}

export function SingularValueDecomposition(A: LA.Matrix|Matrix){
    const M = ensureLAMatrix(A)
    const SVD = new LA.SingularValueDecomposition(M)
    return {
        singularValues: SVD.diagonal,
        leftSingularVectors: SVD.leftSingularVectors,
        rightSingularVectors: SVD.rightSingularVectors
    }
}

export function PowerMethod(A: Matrix, x0: Vector, iter: number): Vector[] {
    const result: Vector[] = []
    var x = x0
    for (let i = 0; i < iter; i++) {
        result.push(x)
        x = ensureVector(normalizeVector(MatrixVectorProduct(A,x)))
    }
    return result
}

