import { Svg, on, off, extend, Matrix, Box } from '@svgdotjs/svg.js'

const normalizeEvent = (ev) =>
  ev.touches || [{ clientX: ev.clientX, clientY: ev.clientY }]

extend(Svg, {
  panZoom (options) {
    this.off('.panZoom')

    // when called with false, disable panZoom
    if (options === false) return this

    options = options || {}
    const zoomFactor = options.zoomFactor || 0.03
    const zoomMin = options.zoomMin || Number.MIN_VALUE
    const zoomMax = options.zoomMax || Number.MAX_VALUE
    const wheelZoomClamp = options.wheelClamp || (svg, level, focus) => { return { level: level, focus: focus } }
    const pinchZoomClamp = options.pinchClamp || (svg, box, focus) => { return { box: box, focus: focus } }
    const panClamp = options.panClamp || (svg, box) => { return box }

    let lastP; let lastTouches; let zoomInProgress = false

    var wheelZoom = function (ev) {
      ev.preventDefault()

      // touchpads can give ev.deltaY == 0, which skrews the lvl calculation
      if (ev.deltaY === 0) return

      let lvl = this.zoom() - zoomFactor * ev.deltaY / Math.abs(ev.deltaY)
      const p = this.point(ev.clientX, ev.clientY)

      if (lvl > zoomMax) { lvl = zoomMax }

      if (lvl < zoomMin) { lvl = zoomMin }

      let clamp = wheelZoomClamp(this, lvl, p);
      
      if (this.dispatch('zoom', clamp).defaultPrevented) { return this }
      
      this.zoom(clamp.level, clamp.focus)
    }

    const pinchZoomStart = function (ev) {
      lastTouches = normalizeEvent(ev)

      if (lastTouches.length < 2) return
      ev.preventDefault()

      if (this.dispatch('pinchZoomStart', { event: ev }).defaultPrevented) { return }

      this.off('touchstart.panZoom', pinchZoomStart)

      zoomInProgress = true
      on(document, 'touchmove.panZoom', pinchZoom, this, { passive: false })
      on(document, 'touchend.panZoom', pinchZoomStop, this, { passive: false })
    }

    const pinchZoomStop = function (ev) {
      ev.preventDefault()
      zoomInProgress = false

      this.dispatch('pinchZoomEnd', { event: ev })

      off(document, 'touchmove.panZoom', pinchZoom)
      off(document, 'touchend.panZoom', pinchZoomStop)
      this.on('touchstart.panZoom', pinchZoomStart)
    }

    const pinchZoom = function (ev) {
      ev.preventDefault()

      const currentTouches = normalizeEvent(ev)
      const zoom = this.zoom()

      // Distance Formula
      const lastDelta = Math.sqrt(
        Math.pow(lastTouches[0].clientX - lastTouches[1].clientX, 2)
        + Math.pow(lastTouches[0].clientY - lastTouches[1].clientY, 2)
      )

      const currentDelta = Math.sqrt(
        Math.pow(currentTouches[0].clientX - currentTouches[1].clientX, 2)
        + Math.pow(currentTouches[0].clientY - currentTouches[1].clientY, 2)
      )

      let zoomAmount = lastDelta / currentDelta

      if ((zoom < zoomMin && zoomAmount > 1) || (zoom > zoomMax && zoomAmount < 1)) {
        zoomAmount = 1
      }

      const currentFocus = {
        x: currentTouches[0].clientX + 0.5 * (currentTouches[1].clientX - currentTouches[0].clientX),
        y: currentTouches[0].clientY + 0.5 * (currentTouches[1].clientY - currentTouches[0].clientY)
      }

      const lastFocus = {
        x: lastTouches[0].clientX + 0.5 * (lastTouches[1].clientX - lastTouches[0].clientX),
        y: lastTouches[0].clientY + 0.5 * (lastTouches[1].clientY - lastTouches[0].clientY)
      }

      const p = this.point(currentFocus.x, currentFocus.y)
      const focusP = this.point(2 * currentFocus.x - lastFocus.x, 2 * currentFocus.y - lastFocus.y)
      const box = new Box(this.viewbox()).transform(
        new Matrix()
          .translate(p.x, p.y)
          .scale(zoomAmount, 0, 0)
          .translate(-focusP.x, -focusP.y)
      )

      this.viewbox(box)

      lastTouches = currentTouches

      let clamp = pinchZoomClamp(this, box, focusP)
      
      this.dispatch('zoom', clamp)
    }

    const panStart = function (ev) {
      ev.preventDefault()

      this.off('mousedown.panZoom', panStart)

      lastTouches = normalizeEvent(ev)

      if (zoomInProgress) return

      this.dispatch('panStart', { event: ev })

      lastP = { x: lastTouches[0].clientX, y: lastTouches[0].clientY }

      on(document, 'mousemove.panZoom', panning, this)
      on(document, 'mouseup.panZoom', panStop, this)
    }

    const panStop = function (ev) {
      ev.preventDefault()

      off(document, 'mousemove.panZoom', panning)
      off(document, 'mouseup.panZoom', panStop)
      this.on('mousedown.panZoom', panStart)

      this.dispatch('panEnd', { event: ev })
    }

    const panning = function (ev) {
      ev.preventDefault()

      const currentTouches = normalizeEvent(ev)

      const currentP = { x: currentTouches[0].clientX, y: currentTouches[0].clientY }

      const p1 = this.point(currentP.x, currentP.y)

      const p2 = this.point(lastP.x, lastP.y)

      const deltaP = [p2.x - p1.x, p2.y - p1.y]

      const box = new Box(this.viewbox()).transform(new Matrix().translate(deltaP[0], deltaP[1]))

      const clamp = panClamp(this, box)
      
      this.viewbox(clamp)
      lastP = currentP
    }

    this.on('wheel.panZoom', wheelZoom)
    this.on('touchstart.panZoom', pinchZoomStart, this, { passive: false })
    this.on('mousedown.panZoom', panStart, this)

    return this
  }
})
