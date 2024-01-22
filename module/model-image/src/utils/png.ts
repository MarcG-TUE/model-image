
import { PNG, PackerOptions } from 'pngjs'
import { arrayBufferToBase64 } from '../utils/utils'

export function pngData(data: number[][][]) {
    const height = data.length
    const width = data[0].length
    return {
        encodedImage: arrayBufferToBase64(asPng(data, width, height)),
        height,
        width
    }
}

function asPng(data: number[][][], width: number, height: number): Uint8Array {

    const png = new PNG({ width, height })

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2
            png.data[idx] = data[y][x][0]
            png.data[idx + 1] = data[y][x][1]
            png.data[idx + 2] = data[y][x][2]
            png.data[idx + 3] = data[y][x][3]
        }
    }

    const o: PackerOptions = {
        colorType: 6
    }
    const buffer = PNG.sync.write(png, o);

    return new Uint8Array(buffer)
}