export enum MouseButton {
  left = 0,
  middle,
  right,
  back,
  forth
}

export interface MarginOptions {
  left: number
  top: number
  right: number
  bottom: number
}

export interface PanZoomOptions {
  panning?: boolean
  pinchZoom?: boolean
  wheelZoom?: boolean
  panButton?: MouseButton
  oneFingerPan?: boolean
  margins?: boolean | MarginOptions
  zoomFactor?: number
  zoomMin?: number
  zoomMax?: number
  wheelZoomDeltaModeLinePixels?: number
  wheelZoomDeltaModeScreenPixels?: number
}

declare module '@svgdotjs/svg.js' {
  interface Svg {
    panZoom(options?: PanZoomOptions | false): this
  }
}
