# svg.panzoom.js

> A plugin for [svg.js](ttps://github.com/svgdotjs/svg.js) that enables panzoom for viewport elements


## Getting started

```
npm install svg.panzoom.js
```

```js
// enables panZoom
var draw = SVG('id').size(1000,1000).panZoom()

// zoom programatically
draw.zoom(lvl, point)
```

You can configure `panZoom` by passing options to it.

- zoomMin: Minimal zoom level
- zoomMax: Maximal zoom level
- zoomFactor: How much is zoomed by one mouse wheel step

This could look like this:

```js
var draw = SVG('id').size(1000,1000).panZoom({zoomMin: 0.5, zoomMax: 20})
```

Setting the min and max value will automatically restrict the zoom to the provided level.  
However you are still able to change the zoom out of that bonds by calling `zoom(lvl)` programatically.

On touchable devices a pinchZoom gesture is supported. Min and max values also apply here.

Zooming is animatable, too:

```js
draw.zoom(1) // uses center of viewport by default
    .animate()
    .zoom(2, {x:100, y:100}) // zoom into specified point
```

To disable `panZoom` or change its options just call it again with `false` or the new options.

## API

`svg.panzoom.js` adds the `.zoom()` method to all [viewbox][¹] elements.

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

[¹]: #viewbox-elements

### viewbox elements

- [SVG.Doc](http://svgjs.com/parents/#svg-doc)
- [SVG.Nested](http://svgjs.com/parents/#svg-nested)

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
draw.on('pinchZoomStart', function(ev) {
    ev.preventDefault()
    ...
})
```
