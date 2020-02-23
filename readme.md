# svg.panzoom.js

> A plugin for [svg.js](https://github.com/svgdotjs/svg.js) that enables panzoom for svg elements

## Getting started

```
npm install @svgdotjs/svg.panzoom.js
```

Include this plugin after including the svg.js library in your html document.

```
<script src="svg.js"></script>
<script src="svg.panzoom.js"></script>
```

Or for esm just import it:

```
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

| Option      | Default          | Description                                                                                                    |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| doPanning   | true             | Enable panning                                                                                                 |
| doPinchZoom | true             | Enable pinch to zoom                                                                                           |
| doWheelZoom | true             | Enable mouse wheel zoom                                                                                        |
| panMouse    | 0                | Which mouse button to use for pan ([info](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button)) |
| zoomFactor  | 0.03             | How quickly to zoom when using `doWheelZoom`                                                                   |
| zoomMin     | 0                | The minimum zoom level                                                                                         |
| zoomMax     | Number.MAX_VALUE | The maximum zoom level                                                                                         |

### Example:

```js
draw.panZoom({
  doWheelZoom: false,
  zoomMin: 0.5,
  zoomMax: 2
})
```

This will disable wheel zooming and set the maximum zoom to 2 or 200% and the minimum zoom to 0.5 or 50%.

## API

`svg.panzoom.js` adds the `.zoom()` method to `<svg>`

- `zoom()` - returns current zoom level
- `zoom(Number)` - will zoom in or out depending if the Number is greater or less than the current zoom level
- `zoom(Number, {x,y})` - will zoom with the x/y coordinate as center point
- `zoom(Number, new SVG.Point(x,y))` - will zoom with the x/y coordinate as center point

| Method                             | Return Value |
| ---------------------------------- | ------------ |
| `zoom()`                           | Number       |
| `zoom(Number)`                     | element      |
| `zoom(Number, {x,y})`              | element      |
| `zoom(Number, new SVG.Point(x,y))` | element      |

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
| pinchZoomStart | `{ event }`      | YES                    |
| pinchZoomEnd   | `{ event }`      | NO                     |

Where [`lvl`](http://svgjs.com/geometry/#svg-box) is the new zoom level,
[`focus`](http://svgjs.com/classes/#svg-point) is point of zoom
and event is the event that triggered the action.

An example of stopping a pan-zoom action:

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
