import { Config, DOMConfig } from "model-image"
import { makeFromJson, makeFromJsonLoop } from "./make-figures"
import * as fs from "fs"
import { JSDOM } from "jsdom"
import path from "path"
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'


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
    watch: boolean|undefined
}
type TArgsStrong = {
    inputFile: string,
    outputFile: string,
    watch: boolean
}

function processArgs(args: any): TArgsStrong{
    const result: TArgs = {
        inputFile: undefined,
        outputFile: undefined,
        watch: false
    }

    result.inputFile = args['_'][0]
    if(args['output-file']) {
        result.outputFile = args['output-file']
    }
    if(args['watch']) {
        result.watch = true
    }
    if (result.inputFile === undefined) {
        throw new Error("Please pass input file to the script with: inputFile <model.json>.");
    }
    if (!fs.existsSync(result.inputFile)) {
        throw new Error(`The specified input file does not exist.`)
    }
    if (result.outputFile === undefined) {
        const filePath = fs.realpathSync(result.inputFile)
        const p = path.parse(filePath)
        result.outputFile = path.join(p.dir, `${p.name}.svg`)
    }
    return result as TArgsStrong
}


console.log("Model-Image Processor")


yargs(hideBin(process.argv))
  .command('npm run start -- <model.json> --output-file=<output-file.svg> --watch', 'process a JSON model image', () => {}, (argv) => {
    console.info(argv)
  })
  .demandCommand(1)
  .parse()


const pArgs = processArgs(yargs.argv)

console.log(pArgs.inputFile)
console.log(typeof(pArgs.inputFile))

if (pArgs.watch) {
    makeFigureLoop(pArgs.inputFile, pArgs.outputFile)
} else {
    makeFigure(pArgs.inputFile, pArgs.outputFile)
}

