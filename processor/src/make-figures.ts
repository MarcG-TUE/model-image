import { JSonSceneParser2D } from "model-image"
import * as fs from "fs"

const MathJaxScaleSVG = 0.7

export function makeFromJson(inputFile: string, outputFile: string) {
    const jsonText = fs.readFileSync(inputFile, "utf-8")
    const sceneDescription = JSON.parse(jsonText)

    const parser = new JSonSceneParser2D(sceneDescription)
    const svg = parser.createScene(null, MathJaxScaleSVG, 1)
    if (svg === undefined) {
        console.error("Failed to create SVG.")
    } else {
        fs.writeFileSync(outputFile, svg.getSvgText())
    }
}

export function makeFromJsonLoop(inputFile: string, outputFile: string, watch: boolean = true) {

    makeFromJson(inputFile, outputFile)
    if (watch) {
        console.log(`Watching for file changes on ${inputFile}`);

        var fsTimeout: NodeJS.Timeout|null
        fs.watch(inputFile, (e: any, filename: string|null) => {
            if (!fsTimeout) {
                // console.log('file.js %s event', e)
                fsTimeout = setTimeout(function() {
                    try {
                        makeFromJson(inputFile, outputFile)
                    } catch (error: any) {
                        console.error(`An error occurred: ${error}`)
                        console.log(error.stack);
                    }
                    fsTimeout=null
                }, 1000)
            }
        })
}
}
