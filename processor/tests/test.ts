import { expect, test } from '@jest/globals'
import * as fs from "fs"
import { makeFromJson } from "../src/make-figures"
import { Config, DOMConfig } from 'model-image';
import { JSDOM } from "jsdom"

DOMConfig.DomParser = () => {
    const dp = (new JSDOM()).window.DOMParser
    return new dp()
}

Config.GetClipartSynchronous = (name: string) => {
    return fs.readFileSync(`./tests/clipart/${name}`, 'utf-8')
}

const Figures = [
    "network-cells",
    "network-cells-antenna-array",
    "network-cells-antenna-beam-forming",
    "mimo-environment",
    "mimo-multi-channel",
    "signal-quantized-finite",
    "signal-quantized",
    "signal",
    "antenna-coherent-addition-1",
    "antenna-coherent-addition-2",
    // "antenna-coherent-addition-3",
    "null-steering",
    // "array-manifold",
    // "array-manifold-one-source",
    // "array-manifold-two-sources",
    // "antenna-data-two-sources",
    // "beamforming-filter-structure",
    // "beamforming-filter-setup",
    // "beamforming-filter-setup-multiple-sources",
    // "qam4-constellation",
    // "channel-model-box",
    // "pulse-shape-rectangle",
    // "modulated-signal",
    // "channel-model-modulation",
    // "modulation-envelope",
    // "channel-model-demodulation",
    // "spectrum-modulated",
    // "spectrum-demodulated",
    // "modulation-transmission",
    // "antenna-array-delay",
    // "modulation-transmission-delay",
    // "antenna-array-uniform-far-field",
    // "antenna-array-triangle",
    // "antenna-response-graph-1",
    // "antenna-response-graph-2",
    // "antenna-response-graph-3",
    // "antenna-response-graph-4",
    // "antenna-array-output-example",
    // "array-manifold-one-source-multipath",
    // "matrix-multiplication-example-channel",
    // "vector-with-ruler",
    // "dependence-antenna-samples",
    // "span-one-source-multipath",
    // "column-span",
    // "antenna-data-one-source-no-noise",
    // "antenna-data-one-source-with-noise",
    // "linear-transformation",
    // "rotation-transformation",
    // "transformation-isometry",
    // "complement-isometry",
    // "transformation-least-squares-domain",
    // "transformation-least-squares-range",
    // "least-squares-curve-fit",
    // "axis3d-svd-end-to-end",
    // "axis3d-svd-step-v",
    // "axis3d-svd-step-sigma",
    // "axis3d-svd-step-u",
    // "transformation-singular-values",
    // "transformation-svd-signal-antenna",
    // "axis-angle-singular-vectors",
    // "antenna-data-svd",
    // "transformation-pseudo-inverse",
    // "transformation-pseudo-inverse-rank-deficient",
    // "channel-and-beamformer-structure",
    // "direction-finding",
    // "training-symbols",
    // "decision-feedback",
    // "condition-number",
    // "zero-forcing-response-graphs",
    // "zero-forcing-output-noise",
    // "wiener-receiver-response-graphs",
    // "mimo-channel-model",
    // "mimo-channel-model-with-receiver",
    // "mimo-channel-model-end-to-end",
    // "scalar-channel",
    // "output-error-interference",
    // "principal-component-analysis",
    // "antenna-data-two-sources-svd",
    // "eigenvectors",
    // "eigenvector-subspace",
    // "harmonic-signals-lti-system",
    // "lti-system",
    // "signal-noise-space",
    // "antenna-data-eigenvalues",
    // "power-method-eigenvector",
    // "power-method-eigenvector-diverging",
    // "unitary-transformation-eigenvalues",
    // "floating-point",
    // "drift-example",
    // "cordic-rotation",
    // "cordic-sin-cos",
    // "cordic-atan",
    // "cordic-pseudo-rotation",
    // "cordic-iteration",
    // "cordic-hardware",
    // "cordic-hardware-iterative",
    // "cordic-hardware-pipeline",
    // "cordic-jacobi-evd",
    // "fft-butterfly",
    // "fft-three-stages",
    // "fir-filter",
    // "averaging-filters",
    // "averaging-filters-frequency-response",
    // "fir-filter-averaging",
    // "fir-filter-averaging-factored",
    // "fir-filter-averaging-optimized",
    // "fir-filter-memory",
    // "fourier-transform-example",
    // "fourier-transform-pairs",
    // "dct-basis-signals",
    // "dft-basis-signals",
    // "time-frequency-musical-notes",
    // "haar-basis-signals",
    // "haar-signal-decomposition",
    // "mp3-compression",
    // "jpeg-basis",
    // "spectrogram",
    // "spectrogram-chirp",
    // "wavelet-basis",
    // "wavelet-ecg-example"
]

// test('test makeFromJson', () => {
//     const inputFile = "./tests/models/vector-with-ruler.json"
//     const outputFile = "./tests/output/vector-with-ruler.svg"
//     const referenceFile = "./tests/output/reference/vector-with-ruler.svg"
//     makeFromJson(inputFile, outputFile)
//     expect(fs.readFileSync(outputFile)).toEqual(fs.readFileSync(referenceFile));
// })

Figures.forEach((fig: string, index: number) => {
    test(`test model ${index}: ${fig}`, () => {
        const inputFile = `./tests/models/${fig}.json`
        const outputFile = `./tests/output/${fig}.svg`
        const referenceFile = `./tests/output/reference/${fig}.svg`
        makeFromJson(inputFile, outputFile)
        expect(fs.readFileSync(outputFile)).toEqual(fs.readFileSync(referenceFile));
    })
})

