import {
  Svg,
  on,
  off,
  extend,
  Matrix,
  Box,
  Point,
  Animator
} from '@svgdotjs/svg.js'

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
    const doWheelZoom = options.doWheelZoom ?? true
    const doPinchZoom = options.doPinchZoom ?? true
    const doPanning = options.doPanning ?? true
    const panMouse = options.panMouse ?? 0
    const oneFingerPan = options.oneFingerPan ?? false
    const margins = options.margins ?? false
    const momentum = options.momentum ?? true
    const friction = options.friction ?? 0.2

    let lastP
    let lastTouches
    let zoomInProgress = false
    let time
    const v = new Point()

    const restrictToMargins = box => {
      if (!margins) return

      const { top, left, bottom, right } = margins
      const { width, height } = this.attr(['width', 'height'])
      const zoom = width / box.width

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

      // touchpads can give ev.deltaY == 0, which skrews the lvl calculation
      if (ev.deltaY === 0) return

      let lvl = Math.pow(1 + zoomFactor, (-1 * ev.deltaY) / 100) * this.zoom()
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
      // In case panStart is called with touch, ev.button is undefined
      if (!(ev.button == null) && ev.button !== panMouse) {
        return
      }

      time = +new Date()

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

    const goMomentum = () => {
      const dt = +new Date() - time

      v.x = v.x * (1 - friction)
      v.y = v.y * (1 - friction)

      console.log(v)

      var clientX = lastP.x - v.x * dt
      var clientY = lastP.y - v.y * dt

      time += dt

      console.log(clientX, clientY)

      panHelper.call(this, { clientX, clientY })

      console.log(v)

      if (Math.abs(v.x) > 0.1 || Math.abs(v.y) > 0.1) {
        console.log('still going')
        Animator.frame(goMomentum)
      }
    }

    const panStop = function (ev) {
      ev.preventDefault()

      off(document, 'touchmove.panZoom mousemove.panZoom', panning)
      off(document, 'touchend.panZoom mouseup.panZoom', panStop)
      this.on('mousedown.panZoom', panStart)

      if (momentum) {
        Animator.frame(goMomentum)
      } else {
        this.dispatch('panEnd', { event: ev })
      }
    }

    const panHelper = function (ev) {
      const currentTouches = normalizeEvent(ev)

      const currentP = {
        x: currentTouches[0].clientX,
        y: currentTouches[0].clientY
      }

      const p1 = this.point(currentP.x, currentP.y)

      const p2 = this.point(lastP.x, lastP.y)

      // delta
      const ds = [p2.x - p1.x, p2.y - p1.y]
      const ds2 = [lastP.x - currentP.x, lastP.y - currentP.y]

      const box = new Box(this.viewbox()).transform(
        new Matrix().translate(ds[0], ds[1])
      )

      restrictToMargins(box)

      this.viewbox(box)
      lastP = currentP

      return ds2
    }

    const panning = function (ev) {
      ev.preventDefault()

      // delta
      const ds = panHelper.call(this, ev)

      const dt = +new Date() - time
      v.x = ds[0] / dt
      v.y = ds[1] / dt

      time += dt
    }

    if (doWheelZoom) {
      this.on('wheel.panZoom', wheelZoom)
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
