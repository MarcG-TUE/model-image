import { expect, test } from '@jest/globals'
import * as fs from "fs"
import { makeFromJson } from "../src/make-figures"
import { Config, DOMConfig } from 'model-image';
import { JSDOM } from "jsdom"
import { compareFiles } from './utils/utils';

DOMConfig.DomParser = () => {
    const dp = (new JSDOM()).window.DOMParser
    return new dp()
}

Config.GetClipartSynchronous = (name: string) => {
    return fs.readFileSync(`./tests/clipart/${name}`, 'utf-8')
}

Config.GetDataFileSynchronous = (name: string) => {
    return fs.readFileSync(`./tests/data/${name}`, 'utf-8')
}

Config.GetBitmapFileSynchronous = (name: string) => {
    return fs.readFileSync(`./tests/clipart/${name}`)
}


const Figures = [
    "antenna-array-delay",
    "antenna-array-triangle",
    "antenna-array-uniform-far-field",
    "antenna-data-eigenvalues",
    "antenna-data-svd",
    "axis-angle-singular-vectors",
    "axis3d-svd-end-to-end",
    "axis3d-svd-step-v",
    "axis3d-svd-step-sigma",
    "axis3d-svd-step-u",
    "beamforming-filter-setup",
    "beamforming-filter-setup-multiple-sources",
    "beamforming-filter-structure",
    "channel-and-beamformer-structure",
    "channel-model-box",
    "channel-model-demodulation",
    "channel-model-modulation",
    "column-span",
    "complement-isometry",
    "condition-number",
    "cordic-atan",
    "cordic-hardware",
    "cordic-hardware-iterative",
    "cordic-hardware-pipeline",
    "cordic-jacobi-evd",
    "cordic-pseudo-rotation",
    "cordic-rotation",
    "cordic-sin-cos",
    "dct-basis-signals",
    "dft-basis-signals",
    "eigenvector-subspace",
    "eigenvectors",
    "fir-filter",
    "fir-filter-averaging",
    "fir-filter-averaging-factored",
    "fir-filter-averaging-optimized",
    "fir-filter-memory",
    "fft-butterfly",
    "fft-three-stages",
    "floating-point",
    "haar-basis-signals",
    "haar-signal-decomposition",
    "harmonic-signals-lti-system",
    "least-squares-curve-fit",
    "linear-transformation",
    "lti-system",
    "matrix-multiplication-example-channel",
    "mimo-channel-model",
    "mimo-channel-model-end-to-end",
    "mimo-channel-model-with-receiver",
    "mimo-environment",
    "mimo-multi-channel",
    "modulated-signal",
    "modulation-envelope",
    "modulation-transmission",
    "modulation-transmission-delay",
    "network-cells",
    "network-cells-antenna-array",
    "network-cells-antenna-beam-forming",
    "null-steering",
    "power-method-eigenvector",
    "power-method-eigenvector-diverging",
    "principal-component-analysis",
    "pulse-shape-rectangle",
    "rotation-transformation",
    "scalar-channel",
    "signal",
    "signal-noise-space",
    "signal-quantized",
    "signal-quantized-finite",
    "spectrum-demodulated",
    "spectrum-modulated",
    "unitary-transformation-eigenvalues",
    "time-frequency-musical-notes",
    "training-symbols",
    "transformation-isometry",
    "transformation-least-squares-domain",
    "transformation-least-squares-range",
    "transformation-pseudo-inverse",
    "transformation-pseudo-inverse-rank-deficient",
    "transformation-singular-values",
    "transformation-svd-signal-antenna",
    "vector-with-ruler",
    "wavelet-ecg-example"
]

Figures.forEach((fig: string, index: number) => {
    test(`test model ${index}: ${fig}`, () => {
        const inputFile = `./tests/models/${fig}.json`
        const outputFile = `./tests/output/${fig}.svg`
        const referenceFile = `./tests/output/reference/${fig}.svg`
        makeFromJson(inputFile, outputFile)
        expect(compareFiles(outputFile, referenceFile)).toBeTruthy()
    })
})

