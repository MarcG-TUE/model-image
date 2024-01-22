
export function randomFloat(rng: any) {
    var result = 0.0
    for (let k=0; k<10; k++) {
        result = result / 10000 + rng()
    }
    return result
}

