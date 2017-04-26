(function() {

'use strict'

var normalizeEvent = function normalizeEvent(ev) {
  if(!ev.touches) {
    ev.touches = [{clientX: ev.clientX, clientY: ev.clientY}]
  }

  return [].slice.call(ev.touches)
}

var getCenterPoint = function getCenterPoint(element) {
  var size = element.node.getBoundingClientRect()
  return element.point(size.width / 2,
                       size.height/ 2)
}

SVG.extend(SVG.Doc, SVG.Nested, SVG.FX, {

  panZoom: function(options) {
    options = options || {}

    var zoomFactor = options.zoomFactor || 0.03

    var lastP, lastTouches, zoomInProgress = false, lastCall = +new Date()

    var wheelZoom = function(ev) {
      ev.preventDefault()

      var zoomAmount = ev.deltaY/Math.abs(ev.deltaY) * zoomFactor + 1

      var p = this.point(ev.clientX, ev.clientY)

      this.zoom(zoomAmount, p)
    }

    var pinchZoomStart = function(ev) {
      lastTouches = normalizeEvent(ev)

      if(lastTouches.length < 2 || zoomInProgress) return
      ev.preventDefault()

      panStop.call(this, ev)

      zoomInProgress = true
      SVG.on(document, 'touchmove', pinchZoom, this, {passive:false})
      SVG.on(document, 'touchend', pinchZoomStop, this, {passive:false})

      //TODO: when to fire zoom?
      this.fire('zoomStart')
    }

    var pinchZoomStop = function(ev) {
      ev.preventDefault()
      zoomInProgress = false

      SVG.off(document,'touchmove', pinchZoom)
      SVG.off(document,'touchend', pinchZoomStop)
      this.on('touchstart', pinchZoomStart)

      if(ev.touches.length > 0) panStart.call(this, ev)
    }

    var pinchZoom = function(ev) {
      ev.preventDefault()
      var currentTouches = normalizeEvent(ev)

      var lastDelta = Math.sqrt((lastTouches[0].clientX - lastTouches[1].clientX)**2 + (lastTouches[0].clientY - lastTouches[1].clientY)**2)
      var currentDelta = Math.sqrt((currentTouches[0].clientX - currentTouches[1].clientX)**2 + (currentTouches[0].clientY - currentTouches[1].clientY)**2)

      var zoomAmount = lastDelta/currentDelta

      var currentFocus = {
        x: currentTouches[0].clientX + 0.5 * (currentTouches[1].clientX - currentTouches[0].clientX),
        y: currentTouches[0].clientY + 0.5 * (currentTouches[1].clientY - currentTouches[0].clientY)
      }

      var lastFocus = {
        x: lastTouches[0].clientX + 0.5 * (lastTouches[1].clientX - lastTouches[0].clientX),
        y: lastTouches[0].clientY + 0.5 * (lastTouches[1].clientY - lastTouches[0].clientY)
      }


      var p = this.point(currentFocus.x, currentFocus.y)
      var focusP = this.point(2*currentFocus.x-lastFocus.x, 2*currentFocus.y-lastFocus.y)
      var b = new SVG.Box(this.viewbox()).transform(
        new SVG.Matrix()
          .translate(p.x, p.y)
          .scale(zoomAmount, 0, 0)
          .translate(-focusP.x, -focusP.y)
      )


      this.viewbox(b)

      lastTouches = currentTouches

      //TODO: when to fire zoom?
      this.fire('zoomEnd')
    }

    var panStart = function(ev) {
      ev.preventDefault()

      this.off('mousedown', panStart)
      this.off('touchstart', panStart)

      lastTouches = normalizeEvent(ev)

      if(zoomInProgress) return

      lastP = {x: lastTouches[0].clientX, y: lastTouches[0].clientY }

      SVG.on(document, 'mousemove', panning, this, {passive:false})
      SVG.on(document, 'touchmove', panning, this, {passive:false})
      SVG.on(document, 'mouseup', panStop, this, {passive:false})
      SVG.on(document, 'touchend', panStop, this, {passive:false})
    }

    var panStop = function(ev) {
      ev.preventDefault()

      SVG.off(document,'mousemove', panning)
      SVG.off(document,'touchmove', panning)
      SVG.off(document,'mouseup', panStop)
      SVG.off(document,'touchend', panStop)
      this.on('mousedown', panStart)
      this.on('touchstart', panStart)
    }

    var panning = function(ev) {
      ev.preventDefault()
      var currentTouches = normalizeEvent(ev)

      var currentP = {x: currentTouches[0].clientX, y: currentTouches[0].clientY }
        , p1 = this.point(currentP.x, currentP.y)
        , p2 = this.point(lastP.x, lastP.y)
        , deltaP = [p2.x - p1.x, p2.y - p1.y]
        , box = new SVG.Box(this.viewbox()).transform(new SVG.Matrix().translate(deltaP[0], deltaP[1]))

      this.viewbox(box)
      lastP = currentP
    }

    this.on('wheel', wheelZoom)
    this.on('touchstart', pinchZoomStart, this, {passive:false})
    this.on('mousedown', panStart, this, {passive:false})
    this.on('touchstart', panStart, this, {passive:false})

    return this

  },

  zoom: function(zoomlevel, point) {
    var isAnimating = this instanceof SVG.FX
    // get target in case of the fx module, otherwise reference this
    var target = isAnimating ? this.target() : this

    if(arguments.length === 0) return target.bbox().width / target.viewbox().width

    if(point == null) point = getCenterPoint(target)

    //TODO: when to fire zoom?		
    target.fire('zoomStart')

    var b = new SVG.Box(target.viewbox())
      .transform(new SVG.Matrix()
          .scale(zoomlevel, point.x, point.y))

    this.viewbox(b)

    //TODO: when to fire zoom?
    if(isAnimating) this.after(target.fire.bind(target, 'zoomEnd'))
    else target.fire('zoomEnd')

    return this
  },

  zoomToOne: function(point) {
    // get target in case of the fx module, otherwise reference this
    var target = this instanceof SVG.FX ? this.target() : this

    this.zoom(target.zoom(), point)

    return this
  }

})


})()
