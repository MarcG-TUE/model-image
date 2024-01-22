import { Config } from "../config/config"

/**
 * Set property value on object if it does not yet exists
 * @param object object
 * @param property property
 * @param value value
 */
export function setPropertyIfNotExists(object: any, property: string, value: any) {
    if (!object.hasOwnProperty(property)) {
        object[property] = value
    }
}

/**
 * Transfer properties from oFrom to oTo if they are not yet defined on oTo
 * @param oFrom Object to transfer properties from
 * @param oTo Object to transfer properties to
 * @param props list of properties
 */
export function transferPropertiesIfNotExist(oFrom: any, oTo: any, props: string[]) {
    props.forEach(p => {
        if (oFrom.hasOwnProperty(p)) {
            setPropertyIfNotExists(oTo, p, oFrom[p])
        }
    })
}

/**
 * Transfer attributes from oFrom to oTo if they are not yet defined on oTo, do not override if they already exist
 * @param oFrom Object to transfer properties from
 * @param oTo Object to transfer properties to
 */
export function transferAttributes(oFrom: any, oTo: any) {
    if (oFrom.hasOwnProperty("attributes")) {
        if (!oTo.hasOwnProperty("attributes")) {
            oTo.attributes = {}
        }
        for (const [key, value] of Object.entries(oFrom.attributes)) {
            if (!oTo.attributes.hasOwnProperty(key)) {
                oTo.attributes[key] = value
            }
        }
    }
}


// from <https://stackoverflow.com/questions/40475155/does-javascript-have-a-method-that-returns-an-array-of-numbers-based-on-start-s>
export function linSpace(start: number, stop: number, num: number, endpoint = true) {
    if (num === 1) {
        return [start]
    }
    if (start === stop) {
        return [start]
    }
    const div = endpoint ? (num - 1) : num
    const step = (stop - start) / div
    return Array.from({ length: num }, (_, i) => start + step * i)
}

export function linSpaceDelta(start: number, stop: number, delta: number) {
    const num = Math.floor((stop - start) / delta) + 1
    return linSpace(start, start + (num - 1) * delta, num)
}


export function shallowCopy(o: any) {
    return { ...o }
    // return Object.create(o)
}

export function deepCopy(o: any) {
    return JSON.parse(JSON.stringify(o))
}

export function arrayBufferToBase64(buffer: Uint8Array) {
    return Buffer.from(buffer).toString('base64')
}

export const dataFile = (f: string) => `../data/${f}`

export function loadData(filename: string): any {
    if (Config.GetDataFileSynchronous === undefined) {
        return loadDataAsynchronous(filename)
    }
    return Config.GetDataFileSynchronous(filename)
}

export function loadDataAsynchronous(filename: string): Promise<any> {
    if (Config.GetDataFileAsynchronous === undefined) {
        throw new Error("No method to get data has been defined.")
    }
    return Config.GetDataFileAsynchronous(filename)
}

export function loadBitmap(filename: string): any {
    if (Config.GetBitmapFileSynchronous === undefined) {
        return loadBitmapAsynchronous(filename)
    }
    return Config.GetBitmapFileSynchronous(filename)
}

export function loadBitmapAsynchronous(filename: string): Promise<any> {
    if (Config.GetBitmapFileAsynchronous === undefined) {
        throw new Error("No method to get bitmap has been defined.")
    }
    return Config.GetBitmapFileAsynchronous(filename)
}


export function indirectEval(exp: string) {
    return ([eval][0])(exp)
}

// Make eval-like function to evaluate in a given context. From:
// <https://stackoverflow.com/questions/8403108/calling-eval-in-particular-context>

function create_context_function_template(eval_string: string, context: any) {
    return `
    return function (context) {
      "use strict";
      ${Object.keys(context).length > 0
            ? `let ${Object.keys(context).map((key) => ` ${key} = context['${key}']`)};`
            : ``
        }
      return ${eval_string};
    }
    `
}

function make_context_evaluator(eval_string: string, context: any) {
    let template = create_context_function_template(eval_string, context)
    let functor = Function(template)
    return functor()
}

export function evalInContext(text: string, context = {}) {
    let evaluator = make_context_evaluator(text, context)
    return evaluator(context)
}
