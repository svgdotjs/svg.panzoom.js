import { Box } from '@svgdotjs/svg.js'

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

// payload of the `afterZoom` event: the box which was just applied and the
// point which was zoomed into
export interface AfterZoomEventDetail {
  box: Box
  focus: { x: number; y: number }
}

declare module '@svgdotjs/svg.js' {
  interface Svg {
    panZoom(options?: PanZoomOptions | false): this
  }
}
