import { Svg, on, off, extend, Matrix, Box } from '@svgdotjs/svg.js'

const normalizeEvent = ev =>
  ev.touches || [{ clientX: ev.clientX, clientY: ev.clientY }]

extend(Svg, {
  panZoom (options) {
    this.off('.panZoom')

    // when called with false, disable panZoom
    if (options === false) return this

    options = options ?? {}
    const zoomFactor = options.zoomFactor ?? 2
    const zoomMin = options.zoomMin ?? Number.MIN_VALUE
    const zoomMax = options.zoomMax ?? Number.MAX_VALUE
    const doWheelZoom = options.wheelZoom ?? true
    const doPinchZoom = options.pinchZoom ?? true
    const doPanning = options.panning ?? true
    const panButton = options.panButton ?? 0
    const oneFingerPan = options.oneFingerPan ?? false
    const margins = options.margins ?? false
    const wheelZoomDeltaModeLinePixels = options.wheelZoomDeltaModeLinePixels ?? 17
    const wheelZoomDeltaModeScreenPixels = options.wheelZoomDeltaModeScreenPixels ?? 53

    let lastP
    let lastTouches
    let zoomInProgress = false

    const restrictToMargins = box => {
      if (!margins) return box
      const { top, left, bottom, right } = margins
      const zoom = this.width() / box.width

      const { width, height } = this.attr(['width', 'height'])

      const leftLimit = width - left / zoom
      const rightLimit = (right - width) / zoom
      const topLimit = height - top / zoom
      const bottomLimit = (bottom - height) / zoom

      box.x = Math.min(leftLimit, Math.max(rightLimit, box.x))
      box.y = Math.min(topLimit, Math.max(bottomLimit, box.y))
      return box
    }

    const wheelZoom = function (ev) {
      ev.preventDefault()

      // When wheeling on a mouse,
      // - chrome by default uses deltaY = 53, deltaMode = 0 (pixel)
      // - firefox by default uses deltaY = 3, deltaMode = 1 (line)
      // - chrome and firefox on windows after configuring "One screen at a time"
      //   use deltaY = 1, deltaMode = 2 (screen)
      //
      // Note that when when wheeling on a touchpad, deltaY depends on how fast
      // you swipe, but the deltaMode is still different between the browsers.
      //
      // Normalize everything so that zooming speed is approximately the same in all cases
      let normalizedPixelDeltaY
      switch (ev.deltaMode) {
      case 1:
        normalizedPixelDeltaY = ev.deltaY * wheelZoomDeltaModeLinePixels
        break
      case 2:
        normalizedPixelDeltaY = ev.deltaY * wheelZoomDeltaModeScreenPixels
        break
      default:
        // 0 (already pixels) or new mode (avoid crashing)
        normalizedPixelDeltaY = ev.deltaY
        break
      }

      let lvl = Math.pow(1 + zoomFactor, (-1 * normalizedPixelDeltaY) / 100) * this.zoom()
      const p = this.point(ev.clientX, ev.clientY)

      if (lvl > zoomMax) {
        lvl = zoomMax
      }

      if (lvl < zoomMin) {
        lvl = zoomMin
      }

      if (this.dispatch('zoom', { level: lvl, focus: p }).defaultPrevented) {
        return this
      }

      this.zoom(lvl, p)

      if (margins) {
        const box = restrictToMargins(this.viewbox())
        this.viewbox(box)
      }
    }

    const pinchZoomStart = function (ev) {
      lastTouches = normalizeEvent(ev)

      // Start panning in case only one touch is found
      if (lastTouches.length < 2) {
        if (doPanning && oneFingerPan) {
          panStart.call(this, ev)
        }
        return
      }

      // Stop panning for more than one touch
      if (doPanning && oneFingerPan) {
        panStop.call(this, ev)
      }

      // We call it so late, so the user is still able to scroll / reload the page via gesture
      // In case oneFingerPan is not active
      ev.preventDefault()

      if (this.dispatch('pinchZoomStart', { event: ev }).defaultPrevented) {
        return
      }

      this.off('touchstart.panZoom', pinchZoomStart)

      zoomInProgress = true
      on(document, 'touchmove.panZoom', pinchZoom, this, { passive: false })
      on(document, 'touchend.panZoom', pinchZoomStop, this, { passive: false })
    }

    const pinchZoomStop = function (ev) {
      ev.preventDefault()

      const currentTouches = normalizeEvent(ev)
      if (currentTouches.length > 1) {
        return
      }

      zoomInProgress = false

      this.dispatch('pinchZoomEnd', { event: ev })

      off(document, 'touchmove.panZoom', pinchZoom)
      off(document, 'touchend.panZoom', pinchZoomStop)
      this.on('touchstart.panZoom', pinchZoomStart)

      if (currentTouches.length && doPanning && oneFingerPan) {
        panStart.call(this, ev)
      }
    }

    const pinchZoom = function (ev) {
      ev.preventDefault()

      const currentTouches = normalizeEvent(ev)
      const zoom = this.zoom()

      // Distance Formula
      const lastDelta = Math.sqrt(
        Math.pow(lastTouches[0].clientX - lastTouches[1].clientX, 2) +
          Math.pow(lastTouches[0].clientY - lastTouches[1].clientY, 2)
      )

      const currentDelta = Math.sqrt(
        Math.pow(currentTouches[0].clientX - currentTouches[1].clientX, 2) +
          Math.pow(currentTouches[0].clientY - currentTouches[1].clientY, 2)
      )

      let zoomAmount = lastDelta / currentDelta

      if (
        (zoom < zoomMin && zoomAmount > 1) ||
        (zoom > zoomMax && zoomAmount < 1)
      ) {
        zoomAmount = 1
      }

      const currentFocus = {
        x:
          currentTouches[0].clientX +
          0.5 * (currentTouches[1].clientX - currentTouches[0].clientX),
        y:
          currentTouches[0].clientY +
          0.5 * (currentTouches[1].clientY - currentTouches[0].clientY)
      }

      const lastFocus = {
        x:
          lastTouches[0].clientX +
          0.5 * (lastTouches[1].clientX - lastTouches[0].clientX),
        y:
          lastTouches[0].clientY +
          0.5 * (lastTouches[1].clientY - lastTouches[0].clientY)
      }

      const p = this.point(currentFocus.x, currentFocus.y)
      const focusP = this.point(
        2 * currentFocus.x - lastFocus.x,
        2 * currentFocus.y - lastFocus.y
      )
      const box = new Box(this.viewbox()).transform(
        new Matrix()
          .translate(-focusP.x, -focusP.y)
          .scale(zoomAmount, 0, 0)
          .translate(p.x, p.y)
      )

      restrictToMargins(box)
      this.viewbox(box)

      lastTouches = currentTouches

      this.dispatch('zoom', { box: box, focus: focusP })
    }

    const panStart = function (ev) {
      const isMouse = ev.type.indexOf('mouse') > -1

      // In case panStart is called with touch, ev.button is undefined
      if (isMouse && ev.button !== panButton && ev.which !== panButton + 1) {
        return
      }

      ev.preventDefault()

      this.off('mousedown.panZoom', panStart)

      lastTouches = normalizeEvent(ev)

      if (zoomInProgress) return

      this.dispatch('panStart', { event: ev })

      lastP = { x: lastTouches[0].clientX, y: lastTouches[0].clientY }

      on(document, 'touchmove.panZoom mousemove.panZoom', panning, this, {
        passive: false
      })

      on(document, 'touchend.panZoom mouseup.panZoom', panStop, this, {
        passive: false
      })
    }

    const panStop = function (ev) {
      ev.preventDefault()

      off(document, 'touchmove.panZoom mousemove.panZoom', panning)
      off(document, 'touchend.panZoom mouseup.panZoom', panStop)
      this.on('mousedown.panZoom', panStart)

      this.dispatch('panEnd', { event: ev })
    }

    const panning = function (ev) {
      ev.preventDefault()

      const currentTouches = normalizeEvent(ev)

      const currentP = {
        x: currentTouches[0].clientX,
        y: currentTouches[0].clientY
      }

      const p1 = this.point(currentP.x, currentP.y)

      const p2 = this.point(lastP.x, lastP.y)

      const deltaP = [p2.x - p1.x, p2.y - p1.y]

      if (!deltaP[0] && !deltaP[1]) {
        return
      }

      const box = new Box(this.viewbox()).transform(
        new Matrix().translate(deltaP[0], deltaP[1])
      )

      lastP = currentP

      restrictToMargins(box)

      if (this.dispatch('panning', { box, event: ev }).defaultPrevented) {
        return
      }

      this.viewbox(box)
    }

    if (doWheelZoom) {
      this.on('wheel.panZoom', wheelZoom, this, { passive: false })
    }

    if (doPinchZoom) {
      this.on('touchstart.panZoom', pinchZoomStart, this, { passive: false })
    }

    if (doPanning) {
      this.on('mousedown.panZoom', panStart, this, { passive: false })
    }

    return this
  }
})
