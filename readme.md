# svg.panzoom.js

> A plugin for [svg.js](https://github.com/svgdotjs/svg.js) that enables panzoom for svg elements

## Getting started

```
npm install @svgdotjs/svg.js @svgdotjs/svg.panzoom.js
```

Include this plugin after including the svg.js library in your html document.

```
<script src="node_modules/@svgdotjs/svg.js/dist/svg.js"></script>
<script src="node_modules/@svgdotjs/svg.panzoom.js/dist/svg.panzoom.js"></script>
```

Or for esm just import it:

```
import { SVG } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.panzoom.js'
```

To enable pan/zoom on an svg:

```js
// enables panZoom
var canvas = SVG()
  .addTo('#id')
  .size(1000, 1000)
  .panZoom()

// zoom programatically
canvas.zoom(lvl, point)
```

You can configure `panZoom` by passing options to it.

- zoomMin: Minimal zoom level
- zoomMax: Maximal zoom level
- zoomFactor: How much is zoomed by one mouse wheel step

This could look like this:

```js
var canvas = SVG()
  .addTo('#id')
  .size(1000, 1000)
  .panZoom({ zoomMin: 0.5, zoomMax: 20 })
```

Setting the min and max value will automatically restrict the zoom to the provided level.  
However you are still able to change the zoom out of that bonds by calling `zoom(lvl)` programatically.

On touchable devices a pinchZoom gesture is supported. Min and max values also apply here.

Zooming is animatable, too:

```js
canvas
  .zoom(1) // uses center of viewport by default
  .animate()
  .zoom(2, { x: 100, y: 100 }) // zoom into specified point
```

To disable `panZoom` or change its options just call it again with `false` or the new options.

## Options

You can override the default options by passing an object in to the `.panZoom({options})` call.

| Option       | Default          | Description                                                                                                    |
| ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| panning      | true             | Enable panning                                                                                                 |
| pinchZoom    | true             | Enable pinch to zoom                                                                                           |
| wheelZoom    | true             | Enable mouse wheel zoom                                                                                        |
| panButton    | 0                | Which mouse button to use for pan ([info](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button)) |
| oneFingerPan | false            | Enables the ability to pan with only one finger instead of two for touchdevices                                |
| margins      | false            | An object {top, left, right, bottom} to restrict the pan area so that at least x px are still visible          |
| zoomFactor   | 2                | How quickly to zoom when using `wheelZoom`                                                                   |
| zoomMin      | Number.MIN_VALUE | The minimum zoom level                                                                                         |
| zoomMax      | Number.MAX_VALUE | The maximum zoom level                                                                                         |
| wheelZoomDeltaModeLinePixels    | 17 | The multiplier to convert wheel zoom deltaY values from deltaMode=1 (lines) to deltaMode=0 (pixels)       |
| wheelZoomDeltaModeScreenPixels  | 53 | The multiplier to convert wheel zoom deltaY values from deltaMode=2 (screen) to deltaMode=0 (pixels)      |

### Example:

```js
draw.panZoom({
  wheelZoom: false,
  zoomMin: 0.5,
  zoomMax: 2
})
```

This will disable wheel zooming and set the maximum zoom to 2 or 200% and the minimum zoom to 0.5 or 50%.

## Events

Multiple events are fired doing different actions. This allow you to respond
to actions and in some cases stop an action via `preventDefault()`.

`zoom` is fired when a mouse wheel event or programmable `zoom()` triggers
a zoom. This usually doesn't happen on mobile devices, in which case
`pinchZoomStart` is fired when a zoom happens.

Events fired from SVG.js are [`CustomEvent`s](http://devdocs.io/dom/customevent),
so the arguments passed from svg.panzoom.js are in in the `.detail` property.

| Event Name     | Argument Value   | preventDefault support |
| -------------- | ---------------- | ---------------------- |
| zoom           | `{ lvl, focus }` | YES                    |
| panStart       | `{ event }`      | NO                     |
| panEnd         | `{ event }`      | NO                     |
| panning        | `{ box }`        | YES                    |
| pinchZoomStart | `{ event }`      | YES                    |
| pinchZoomEnd   | `{ event }`      | NO                     |

Where `lvl` is the new zoom level,
[`focus`](https://svgjs.com/docs/3.0/classes/#svg-point) is th point of zoom, [`box`](https://svgjs.com/docs/3.0/classes/#svg-box) is the new calculated viewbox
and event is the event that triggered the action.

An example of stopping a pinch-zoom action:

```js
var canvas = SVG()
  .addTo('#id')
  .size(1000, 1000)
  .panZoom()

canvas.on('pinchZoomStart', function (ev) {
  ev.preventDefault()
  // ...
})
```
