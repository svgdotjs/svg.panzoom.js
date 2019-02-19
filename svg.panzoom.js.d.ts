interface options {
  zoomFactor?: number,
  zoomMin?: number,
  zoomMax?: number
}

declare module "@svgdotjs/svg.js" {
  interface Svg {
    panzoom(options?: options): this
  }
}
