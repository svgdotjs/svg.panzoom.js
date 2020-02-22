/*!
* @svgdotjs/svg.panzoom.js - A plugin for svg.js that enables panzoom for viewport elements
* @version 2.0.3
* https://github.com/svgdotjs/svg.panzoom.js#readme
*
* @copyright undefined
* @license MIT
*
* BUILT: Tue Jun 11 2019 11:19:25 GMT+0200 (GMT+02:00)
*/;
(function (svg_js) {
  'use strict';

  var IS_SUPPORTED_TOUCH = (function hasTouchSupport() {
    return (
      'ontouchstart' in window || // touch events
      (window.Modernizr && window.Modernizr.touch) || // modernizr
      (navigator.msMaxTouchPoints || navigator.maxTouchPoints) > 2
    ) // pointer events
  })()

  var EVENT_MAP = {
    mousedown: IS_SUPPORTED_TOUCH ? 'touchstart' : 'mousedown',
    mousemove: IS_SUPPORTED_TOUCH ? 'touchmove' : 'mousemove',
    mouseup: IS_SUPPORTED_TOUCH ? 'touchend' : 'mouseup'
  }

  var normalizeEvent = function normalizeEvent(ev) {
    return ev.touches || [{
      clientX: ev.clientX,
      clientY: ev.clientY
    }];
  };

  svg_js.extend(svg_js.Svg, {
    panZoom: function panZoom(options) {
      this.off('.panZoom'); // when called with false, disable panZoom

      if (options === false) return this;
      options = options || {};
      var zoomFactor = options.zoomFactor || 0.03;
      var zoomMin = options.zoomMin || Number.MIN_VALUE;
      var zoomMax = options.zoomMax || Number.MAX_VALUE;
      var lastP;
      var lastTouches;
      var zoomInProgress = false;

      var wheelZoom = function wheelZoom(ev) {
        ev.preventDefault(); // touchpads can give ev.deltaY == 0, which skrews the lvl calculation

        if (ev.deltaY === 0) return;
        var lvl = this.zoom() - zoomFactor * ev.deltaY / Math.abs(ev.deltaY);
        var p = this.point(ev.clientX, ev.clientY);

        if (lvl > zoomMax) {
          lvl = zoomMax;
        }

        if (lvl < zoomMin) {
          lvl = zoomMin;
        }

        if (this.dispatch('zoom', {
          level: lvl,
          focus: p
        }).defaultPrevented) {
          return this;
        }

        this.zoom(lvl, p);
      };

      var pinchZoomStart = function pinchZoomStart(ev) {
        lastTouches = normalizeEvent(ev);
        if (lastTouches.length < 2) return;
        ev.preventDefault();

        if (this.dispatch('pinchZoomStart', {
          event: ev
        }).defaultPrevented) {
          return;
        }

        this.off('touchstart.panZoom', pinchZoomStart);
        zoomInProgress = true;
        svg_js.on(document, 'touchmove.panZoom', pinchZoom, this, {
          passive: false
        });
        svg_js.on(document, 'touchend.panZoom', pinchZoomStop, this, {
          passive: false
        });
      };

      var pinchZoomStop = function pinchZoomStop(ev) {
        ev.preventDefault();
        zoomInProgress = false;
        this.dispatch('pinchZoomEnd', {
          event: ev
        });
        svg_js.off(document, 'touchmove.panZoom', pinchZoom);
        svg_js.off(document, 'touchend.panZoom', pinchZoomStop);
        this.on('touchstart.panZoom', pinchZoomStart);
      };

      var pinchZoom = function pinchZoom(ev) {
        ev.preventDefault();
        var currentTouches = normalizeEvent(ev);
        var zoom = this.zoom(); // Distance Formula

        var lastDelta = Math.sqrt(Math.pow(lastTouches[0].clientX - lastTouches[1].clientX, 2) + Math.pow(lastTouches[0].clientY - lastTouches[1].clientY, 2));
        var currentDelta = Math.sqrt(Math.pow(currentTouches[0].clientX - currentTouches[1].clientX, 2) + Math.pow(currentTouches[0].clientY - currentTouches[1].clientY, 2));
        var zoomAmount = lastDelta / currentDelta;

        if (zoom < zoomMin && zoomAmount > 1 || zoom > zoomMax && zoomAmount < 1) {
          zoomAmount = 1;
        }

        var currentFocus = {
          x: currentTouches[0].clientX + 0.5 * (currentTouches[1].clientX - currentTouches[0].clientX),
          y: currentTouches[0].clientY + 0.5 * (currentTouches[1].clientY - currentTouches[0].clientY)
        };
        var lastFocus = {
          x: lastTouches[0].clientX + 0.5 * (lastTouches[1].clientX - lastTouches[0].clientX),
          y: lastTouches[0].clientY + 0.5 * (lastTouches[1].clientY - lastTouches[0].clientY)
        };
        var p = this.point(currentFocus.x, currentFocus.y);
        var focusP = this.point(2 * currentFocus.x - lastFocus.x, 2 * currentFocus.y - lastFocus.y);
        var box = new svg_js.Box(this.viewbox()).transform(new svg_js.Matrix().translate(p.x, p.y).scale(zoomAmount, 0, 0).translate(-focusP.x, -focusP.y));
        this.viewbox(box);
        lastTouches = currentTouches;
        this.dispatch('zoom', {
          box: box,
          focus: focusP
        });
      };

      var panStart = function panStart(ev) {
        ev.preventDefault();
        this.off(EVENT_MAP.mousedown+'.panZoom', panStart);
        lastTouches = normalizeEvent(ev);
        if (zoomInProgress) return;
        this.dispatch('panStart', {
          event: ev
        });
        lastP = {
          x: lastTouches[0].clientX,
          y: lastTouches[0].clientY
        };
        svg_js.on(document, EVENT_MAP.mousemove+'.panZoom', panning, this);
        svg_js.on(document, EVENT_MAP.mouseup+'.panZoom', panStop, this);
      };

      var panStop = function panStop(ev) {
        ev.preventDefault();
        svg_js.off(document, EVENT_MAP.mousemove+'.panZoom', panning);
        svg_js.off(document, EVENT_MAP.mouseup+'.panZoom', panStop);
        this.on(EVENT_MAP.mousedown+'.panZoom', panStart);
        this.dispatch('panEnd', {
          event: ev
        });
      };

      var panning = function panning(ev) {
        ev.preventDefault();
        var currentTouches = normalizeEvent(ev);
        var currentP = {
          x: currentTouches[0].clientX,
          y: currentTouches[0].clientY
        };
        var p1 = this.point(currentP.x, currentP.y);
        var p2 = this.point(lastP.x, lastP.y);
        var deltaP = [p2.x - p1.x, p2.y - p1.y];
        var box = new svg_js.Box(this.viewbox()).transform(new svg_js.Matrix().translate(deltaP[0], deltaP[1]));
        this.viewbox(box);
        lastP = currentP;
      };

      this.on('wheel.panZoom', wheelZoom);
      this.on('touchstart.panZoom', pinchZoomStart, this, {
        passive: false
      });
      this.on(EVENT_MAP.mousedown+'.panZoom', panStart, this);
      return this;
    }
  });

}(SVG));
//# sourceMappingURL=svg.panzoom.js.map
