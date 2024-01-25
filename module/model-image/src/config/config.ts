// factor out some functions that depend on the platform, node.js, or browser
export type TModelImageConfig = {
    GetClipartSynchronous: undefined | ((name: string)=>string),
    GetDataFileSynchronous: undefined | ((name: string)=>any),
    GetBitmapFileSynchronous: undefined | ((name: string)=>any),
    GetDataFileAsynchronous: undefined | ((name: string)=>Promise<any>)
    GetClipartAsynchronous: undefined | ((name: string)=>Promise<string>)
    GetBitmapFileAsynchronous: undefined | ((name: string)=>Promise<any>)
    ConvertToPng: undefined | ((data: number[][][], width: number, height:number)=>Uint8Array)
}

export var Config: TModelImageConfig = {
    // ClipArtRootFetch: "https://mgeilen.pages.tue.nl/5lik0/2dviewer/clipart/",
    GetClipartSynchronous: undefined,
    GetClipartAsynchronous: undefined,
    GetDataFileSynchronous: undefined,
    GetDataFileAsynchronous: undefined,
    GetBitmapFileSynchronous: undefined,
    GetBitmapFileAsynchronous: undefined,
    ConvertToPng: undefined
}



