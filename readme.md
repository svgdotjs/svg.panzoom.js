# svg.panzoom.js

> A plugin for [svg.js](ttps://github.com/svgdotjs/svg.js) that enables panzoom for viewport elements


## Getting started

```
npm install svg.panzoom.js
```

```js
var draw = SVG('id').size(1000,1000).panZoom()
```

The SVG element now support panning via mouse-down/mouse-move
and zooming via the mouse wheel. On touch devices, pinch-zoom
support allow you to pan and zoom in one gesture.

You can also animate zooming:

```js
draw.zoom(1) // uses center of viewport by default
    .animate()
    .zoom(2, {x:100, y:100}) // zoom into specified point
```


## API

`svg.panzoom.js` adds the `.zoom()` method to the element `.panZoom()` is called on.

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

| Event Name     | Argument Value   | preventDefault support |
| -------------- | ---------------- | ---------------------- |
| zoom           | `{ box, focus }` | YES                    |
| panStart       | `{ event }`      | NO                     |
| panEnd         | `{ event }`      | NO                     |
| pinchZoomStart | `{ event }`      | YES                    |
| pinchZoomEnd   | `{ event }`      | NO                     |

Where [`box`](http://svgjs.com/geometry/#svg-box) is the new viewport,
[`focus`](http://svgjs.com/classes/#svg-point) is point of zoom
and event is the event that triggered the action.

An example of stopping a pan-zoom action:

```js
var draw = SVG('id').size(1000,1000).panZoom()
draw.on('pinchZoomStart', function(arg) {
    arg.event.preventDefault()
    ...
})
```
