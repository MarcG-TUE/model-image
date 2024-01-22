export type TModelViewerConfig = {
    GetClipartSynchronous: undefined | ((name: string)=>string),
    GetDataFileSynchronous: undefined | ((name: string)=>any),
    GetBitmapFileSynchronous: undefined | ((name: string)=>any),
    GetDataFileAsynchronous: undefined | ((name: string)=>Promise<any>)
    GetClipartAsynchronous: undefined | ((name: string)=>Promise<string>)
    GetBitmapFileAsynchronous: undefined | ((name: string)=>Promise<any>)
}

export var Config: TModelViewerConfig = {
    // ClipArtRootFetch: "https://mgeilen.pages.tue.nl/5lik0/2dviewer/clipart/",
    GetClipartSynchronous: undefined,
    GetClipartAsynchronous: undefined,
    GetDataFileSynchronous: undefined,
    GetDataFileAsynchronous: undefined,
    GetBitmapFileSynchronous: undefined,
    GetBitmapFileAsynchronous: undefined
}



