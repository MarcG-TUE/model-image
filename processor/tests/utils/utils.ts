import { diffChars } from "diff";
import * as fs from "fs"

export function compareFiles(f1: string, f2: string) {
    const file1 = fs.readFileSync(f1, 'utf8')
    const file2 = fs.readFileSync(f2, 'utf8')

    const differences = diffChars(file1, file2)
        .filter(part =>
            part.value !== '\r\n' &&
            part.value !== '\n'&&
            part.value !== '\r'
        )
        .filter(part => part.added || part.removed)
    return differences.length === 0
}