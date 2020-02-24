enum mousebutton {
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
  zoomFactor?: number
  zoomMin?: number
  zoomMax?: number
  doPanning?: boolean
  doPinchZoom?: boolean
  doWheelZoom?: boolean
  panMouse?: mousebutton
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
