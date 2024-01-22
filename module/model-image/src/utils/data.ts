import { rnGen } from "./random"

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(rnGen: ()=>number, mean=0, stDev=1) {
    const u = 1 - rnGen() // Converting [0,1) to (0,1]
    const v = rnGen()
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
    // Transform to the desired mean and standard deviation:
    return z * stDev + mean
}

function randomArray(rnGen: ()=>number, length: number, type: string, mean: number, variance: number = 1): number[] {
    var result = []
    switch (type) {
        case "gaussian":
            result = Array.from({length}, (_, i) => gaussianRandom(rnGen, mean, Math.sqrt(variance)))
            break

        case "uniform":
            result = new Array(length).map(x=> rnGen())
        break

        default:
            throw new Error(`Unknown distribution type: ${type}`)
    }
    return result
}

export function generateRandomData(length: number, type: string, mean: number, variance: number, numberOfSamples: number, seed: number): number[][] {
    const rng = rnGen(seed)
    return Array.from({length: numberOfSamples}, (_, i) => randomArray(rng, length, type, mean, variance))
}