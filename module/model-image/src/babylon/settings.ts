export const NumberOfManifoldPoints = 500
export const ManifoldColor = BABYLON.Color3.Blue();
export const SpanColor = new BABYLON.Color4(0.2, 1.0, 0.7, 0.9)

export type TArrowOptions = {
    innerWidth: number,
    outerWidth: number,
    tipLength: number,
    nrSegments: number
}

export const DefaultArrow: TArrowOptions = {
    innerWidth: 0.015,
    outerWidth: 0.05,
    tipLength: 0.1,
    nrSegments: 10
}

