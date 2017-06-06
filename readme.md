# svg.panzoom.js

> A plugin for [svg.js](ttps://github.com/svgdotjs/svg.js) that enables panzoom for viewport elements


## Get started

```
npm install svg.panzoom.js
```

```js
var draw = SVG('id').size(1000,1000).panZoom()
```

The plugin also adds a zoom function which you can use and animate:

```js
draw.zoom(1) // uses center of viewport by default
    .animate()
    .zoom(2, {x:100, y:100}) // zoom into specified point
```

## Events

Zooming fires a `zoom` event which you can bind to.
It's possible to `preventDefault` this event.
However, this event is _NOT_ fired when pinchzooming on mobile devices.