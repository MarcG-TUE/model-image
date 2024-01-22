import * as LA from 'ml-matrix';

export type ComplexNumber=[number,number]
export type ComplexVector=ComplexNumber[]
// represent a matrix of complex values as a list of column vectors
export type ComplexMatrix=ComplexVector[]

const epsilon = 0.000001

export function cAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
    return [a[0]+b[0], a[1]+b[1]]
}

export function cMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
    return [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]]
}

export function cConjugate(a: ComplexNumber): ComplexNumber {
    return [a[0], -a[1]]
}

export function cAbsSquare(a: ComplexNumber): number {
    return a[0]*a[0]+a[1]*a[1]
}

export function cAbs(a: ComplexNumber): number {
    return Math.sqrt(cAbsSquare(a))
}

export function cArg(a: ComplexNumber): number {
    return Math.atan2(a[1], a[0])
}

export function cExp(phi: number): ComplexNumber {
    return [Math.cos(phi),Math.sin(phi)]
}

export function cInnerProduct(v1: ComplexVector, v2: ComplexVector): ComplexNumber {
    var sum: ComplexNumber = [0,0]
    for (let n=0; n< v1.length; n++) {
        sum = cAdd(sum, cMul(cConjugate(v1[n]), v2[n]))
    }
    return sum
}

export function cAddVectors(v1: ComplexVector, v2: ComplexVector): ComplexVector {
    return v1.map((v,i)=>cAdd(v,v2[i]))
}

export function cAddMatrices(A1: ComplexMatrix, A2: ComplexMatrix): ComplexMatrix {
    return A1.map((v,i)=>cAddVectors(v,A2[i]))
}

export function cSubtractVectors(v1: ComplexVector, v2: ComplexVector): ComplexVector {
    return v1.map((v,i)=>cAdd(v,cMul([-1,0], v2[i])))
}

export function cSubtractMatrices(A1: ComplexMatrix, A2: ComplexMatrix): ComplexMatrix {
    return A1.map((v,i)=>cSubtractVectors(v,A2[i]))
}


export function cScaleVector(v: ComplexVector, c: ComplexNumber): ComplexVector {
    return v.map(x=>cMul(c,x))
}

export function cScaleMatrix(A: ComplexMatrix, c: ComplexNumber): ComplexMatrix {
    return A.map(v=>cScaleVector(v,c))
}

export function cVectorNormSquare(v: ComplexVector): number {
    var sum = 0
    v.forEach(x=>{
        sum += x[0]*x[0]+x[1]*x[1]
    })
    return sum
}

export function cFrobeniusNormSquare(M: ComplexMatrix): number {
    var sum = 0
    M.forEach(v=>{
        sum += cVectorNormSquare(v)
    })
    return sum
}



export function cConjugateMatrixProduct(A: ComplexMatrix, B: ComplexMatrix): ComplexMatrix {
    const szA = sizeOfMatrix(A)
    const szB = sizeOfMatrix(B)
    const rKeys = [...Array(szA[1]).keys()]
    const cKeys = [...Array(szB[1]).keys()]

    return cKeys.map(j => (
        rKeys.map(i=>(
            cInnerProduct(A[i],B[j])
        ))
    ))
}

export function cConjugateMatrixVectorProduct(A: ComplexMatrix, x: ComplexVector): ComplexVector {
    const sz = sizeOfMatrix(A)
    const cKeys = [...Array(sz[1]).keys()]

    return cKeys.map(i => (
            cInnerProduct(A[i],x)
    ))
}


export function cConjugateTransposeMatrix(A: ComplexMatrix): ComplexMatrix {
    const sz = sizeOfMatrix(A)
    const rowKeys = [...Array(sz[1]).keys()]
    const colKeys = [...Array(sz[0]).keys()]
    return colKeys.map(c=>(
        rowKeys.map(r=>(
            cConjugate(A[r][c])
        ))
    ))
}

export function cTransposeMatrix(A: ComplexMatrix): ComplexMatrix {
    const sz = sizeOfMatrix(A)
    const rowKeys = [...Array(sz[1]).keys()]
    const colKeys = [...Array(sz[0]).keys()]
    return colKeys.map(c=>(
        rowKeys.map(r=>(
            A[r][c]
        ))
    ))
}

export function cMultiplyMatrices(A: ComplexMatrix, B: ComplexMatrix): ComplexMatrix {
    return cConjugateMatrixProduct(cConjugateTransposeMatrix(A),B)
}

export function cMultiplyMatrixVector(A: ComplexMatrix, x: ComplexVector): ComplexVector {

    return cConjugateMatrixVectorProduct(cConjugateTransposeMatrix(A),x)
}


export function sizeOfMatrix(A: ComplexMatrix): [number,number] {
    if (A.length === 0 ) {
        return [0, 0]
    }
    return [A[0].length, A.length]
}

function realPartOfVector(v: ComplexVector): LA.Matrix {
    return LA.Matrix.columnVector(v.map((n: ComplexNumber)=>n[0]))
}

function imaginaryPartOfVector(v: ComplexVector): LA.Matrix {
    return LA.Matrix.columnVector(v.map((n: ComplexNumber)=>n[1]))
}

function realPartOfMatrix(A: ComplexMatrix): LA.Matrix {
    const sz = sizeOfMatrix(A)
    const result = new LA.Matrix(...sz)
    A.forEach((c: ComplexVector, i: number)=>{
        result.setColumn(i, realPartOfVector(c))
    })
    return result
}

function imaginaryPartOfMatrix(A: ComplexMatrix): LA.Matrix {
    const sz = sizeOfMatrix(A)
    const result = new LA.Matrix(...sz)
    A.forEach((c: ComplexVector, i: number)=>{
        result.setColumn(i, imaginaryPartOfVector(c))
    })
    return result
}

function complexVectorFromRealAndImaginary(re: LA.Matrix, im: LA.Matrix): ComplexVector {
    const N = re.rows
    const keys = [...Array(N).keys()]
    return keys.map((i: number)=>[re.get(i,0),im.get(i,0)])
}

function firstNonZeroElement(v: ComplexVector): ComplexNumber {
    for (var i=0; i<v.length; i++) {
        const c = v[i]
        if (cAbs(c)>epsilon) {
            return c
        }
    }
    throw new Error("Vector is zero.");

}

export function cDiagonalMatrix(values: ComplexNumber[]): ComplexMatrix {
    const keys = [...Array(values.length).keys()]
    return keys.map(i=>(
        keys.map(j=>{
            if (i===j) {
                return values[i]
            } else {
                return [0,0]
            }
        })
    ))
}

export function cIdentityMatrix(N: number): ComplexMatrix {
    const keys = [...Array(N).keys()]
    return keys.map(i=>(
        keys.map(j=>{
            if (i===j) {
                return [1,0]
            } else {
                return [0,0]
            }
        })
    ))
}

export function eigenValueDecomposition(A: ComplexMatrix) {

    function findSimilarVector(list: ComplexVector[], v: ComplexVector): boolean{
        for(var i=0; i<list.length; i++){
            const u = list[i]
            if (cVectorNormSquare(cSubtractVectors(u,v))<epsilon) {
                return true
            }
        }
        return false
    }

    const N = A.length
    const M = new LA.Matrix(2*N, 2*N)
    const Are = realPartOfMatrix(A)
    const Aim = imaginaryPartOfMatrix(A)
    M.setSubMatrix(Are, 0, 0)
    M.setSubMatrix(Aim, N, 0)
    M.setSubMatrix(Aim.mul(-1), 0, N)
    M.setSubMatrix(Are, N, N)

    var e = new LA.EigenvalueDecomposition(M);
    var real = e.realEigenvalues;
    var vectors = e.eigenvectorMatrix;
    const eigenvalues: number[] = []
    const eigenvectors: ComplexVector[] = []
    for (let i=0; i<2*N; i++){
        const v= complexVectorFromRealAndImaginary(
            vectors.subMatrix(0,N-1,i,i),
            vectors.subMatrix(N,2*N-1,i,i))
            const c = cArg(firstNonZeroElement(v))
            const vn = cScaleVector(v, cConjugate(cExp(c)))
            if (! findSimilarVector(eigenvectors, vn)) {
                eigenvectors.push(vn)
                eigenvalues.push(real[i])
            }
    }
    return {eigenvalues, eigenvectors}
}

export function economySizeSingularValueDecomposition(A: ComplexMatrix) {
    const AHA=cConjugateMatrixProduct(A,A)
    const {eigenvalues, eigenvectors} = eigenValueDecomposition(AHA)
    // eigenvalues are the square of the singular values
    //eigenvectors are right singular vectors
    const V: ComplexMatrix = []
    const Sigma: number[] = []

    for(var i=0; i<eigenvalues.length; i++) {
        if (eigenvalues[i]>epsilon) {
            Sigma.push(Math.sqrt(eigenvalues[i]))
            V.push(eigenvectors[i])
        }
    }

    //u[k] = A^H v[k] / sigma[k]
    const U = cMultiplyMatrices(cMultiplyMatrices(A,V),cDiagonalMatrix(Sigma.map(s=>[1/s,0])))
    return {U,Sigma,V}
}

export function pseudoInverse(A: ComplexMatrix): ComplexMatrix {
    const{U,Sigma,V} = economySizeSingularValueDecomposition(A)

    // compute economy size matrices
    const Ve: ComplexMatrix = []
    const Ue: ComplexMatrix = []
    const SigmaEInv: number[] = []
    for(var i=0; i<Sigma.length; i++){
        if (Sigma[i] > epsilon) {
            Ve.push(V[i])
            Ue.push(U[i])
            SigmaEInv.push(1.0/Sigma[i])
        }
    }
    const keysVe = [...Array(Ve.length).keys()]
    const VeSigmaInv = keysVe.map(k=>(
        cScaleVector(Ve[k], [SigmaEInv[k],0])
    ))
    return cMultiplyMatrices(VeSigmaInv, cConjugateTransposeMatrix(U))
}
