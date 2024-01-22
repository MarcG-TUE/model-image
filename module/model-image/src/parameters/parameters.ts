export type Parameter = {
    name: string,
    type: string,
    initialValue: string,
    range: [number, number],
    step: number,
    description: string,
    onChange: (v: number) => void,
    order: number
}
