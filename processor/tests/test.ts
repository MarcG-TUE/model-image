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
    console.warn(`./tests/clipart/${name}.svg`)
    return fs.readFileSync(`./tests/clipart/${name}`, 'utf-8')
}

test('test makeFromJson', () => {
    const inputFile = "./tests/models/vector-with-ruler.json"
    const outputFile = "./tests/output/vector-with-ruler.svg"
    const referenceFile = "./tests/output/reference/vector-with-ruler.svg"
    makeFromJson(inputFile, outputFile)
    expect(fs.readFileSync(outputFile)).toEqual(fs.readFileSync(referenceFile));
});
