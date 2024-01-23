import { Config, DOMConfig } from "model-image"
import { makeFromJson, makeFromJsonLoop } from "./make-figures"
import * as fs from "fs"
import { JSDOM } from "jsdom"
import path from "path"

const clipartSrcDir = "./tests/clipart"
const dataFileSrcDir = "./tests/data"



function makeFigure(inputFile: string, outputFile: string) {
    console.log(outputFile)
    makeFromJson(inputFile, outputFile)
}

Config.GetClipartSynchronous = (name: string) => {
    return fs.readFileSync(`${clipartSrcDir}/${name}`, "utf-8")
}

Config.GetBitmapFileSynchronous = (name: string) => {
    return fs.readFileSync(`${clipartSrcDir}/${name}`)
}

Config.GetDataFileSynchronous = (name: string) => {
    const dataText = fs.readFileSync(`${dataFileSrcDir}/${name}`, "utf-8")
    return JSON.parse(dataText)
}

DOMConfig.DomParser = () => {
    const dp = (new JSDOM()).window.DOMParser
    return new dp()
}

type TArgs = {inputFile: string|undefined, outputFile: string|undefined}
type TArgsStrong = {inputFile: string, outputFile: string}

function processArgs(args: string[]): TArgsStrong{
    const result: TArgs = {
        inputFile: undefined,
        outputFile: undefined
    }
    var i = 2
    while (i<args.length) {
        if (args[i].startsWith("output-file=")) {
            result.outputFile = args[i].substring("output-file=".length)
        } else {
            result.inputFile = args[i]
        }
        i += 1
    }
    if (result.inputFile === undefined) {
        throw new Error("Please pass input file to the script.");
    }
    if (result.outputFile === undefined) {
        const filePath = fs.realpathSync(result.inputFile)
        const p = path.parse(filePath)
        result.outputFile = path.join(p.dir, `${p.name}.svg`)
    }
    return result as TArgsStrong
}


// makeFigureLoop("antenna-data-one-source-no-noise")

// args
// -o outputfile
// inputfile

const pArgs = processArgs(process.argv)
makeFigure(pArgs.inputFile, pArgs.outputFile)

