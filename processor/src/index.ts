import { Config, DOMConfig } from "model-image"
import { makeFromJson, makeFromJsonLoop } from "./make-figures"
import * as fs from "fs"
import { JSDOM } from "jsdom"
import path from "path"

const clipartSrcDir = "./tests/clipart"
const dataFileSrcDir = "./tests/data"



function makeFigure(inputFile: string, outputFile: string) {
    console.log(`Processing: ${inputFile}`)
    console.log(`Output: ${outputFile}`)
    makeFromJson(inputFile, outputFile)
}

function makeFigureLoop(inputFile: string, outputFile: string) {
    console.log(`Processing: ${inputFile}`)
    console.log(`Output: ${outputFile}`)
    makeFromJsonLoop(inputFile, outputFile)
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

type TArgs = {
    inputFile: string|undefined,
    outputFile: string|undefined
    loop: boolean|undefined
}
type TArgsStrong = {
    inputFile: string,
    outputFile: string,
    loop: boolean
}

function processArgs(args: string[]): TArgsStrong{
    const result: TArgs = {
        inputFile: undefined,
        outputFile: undefined,
        loop: false
    }
    var i = 2
    while (i<args.length) {
        if (args[i].startsWith("output-file=")) {
            result.outputFile = args[i].substring("output-file=".length)
        } else if (args[i].startsWith("loop")) {
            result.loop = true
        }
        else {
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


// args
// -o outputfile
// inputfile

const pArgs = processArgs(process.argv)
if (pArgs.loop) {
    makeFigureLoop(pArgs.inputFile, pArgs.outputFile)
} else {
    makeFigure(pArgs.inputFile, pArgs.outputFile)
}

