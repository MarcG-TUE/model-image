
import { Config } from '../config/config'
import { arrayBufferToBase64 } from '../utils/utils'

export function pngData(data: number[][][]) {
    const height = data.length
    const width = data[0].length
    if (Config.ConvertToPng === undefined) {
        throw new Error("ConvertToPng has not been set.");

    }
    return {
        encodedImage: arrayBufferToBase64(Config.ConvertToPng(data, width, height)),
        height,
        width
    }
}

