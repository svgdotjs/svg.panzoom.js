export enum MouseButton {
  left = 0,
  middle,
  right,
  back,
  forth
}

interface marginOptions {
  left: number
  top: number
  right: number
  bottom: number
}

interface options {
  panning?: boolean
  pinchZoom?: boolean
  wheelZoom?: boolean
  panMouse?: MouseButton
  oneFingerPan?: boolean
  margins?: boolean | marginOptions
  zoomFactor?: number
  zoomMin?: number
  zoomMax?: number
}

declare module '@svgdotjs/svg.js' {
  interface Svg {
    panZoom(options?: options | false): this
  }
}
