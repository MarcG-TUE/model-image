import * as LA from 'ml-matrix';
import * as BBL from "babylonjs"

export function laVectorToBblVector(v: LA.Matrix): BBL.Vector3 {
    return new BBL.Vector3(
        v.get(0, 0),
        v.get(1, 0),
        v.get(2, 0)
    )
}