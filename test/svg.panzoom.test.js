import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHTMLWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
import '../src/svg.panzoom.js'

const window = createHTMLWindow()
const document = window.document
registerWindow(window, document)

// the plugin registers its move/end handlers on the global document
globalThis.window = window
globalThis.document = document

// svgdom has no layout, so the size the plugin reads off the node is faked
const makeSvg = (options = {}, size = 1000) => {
  const svg = SVG().size(size, size).viewbox(0, 0, 1000, 1000)
  svg.node.clientWidth = size
  svg.node.clientHeight = size
  return svg.panZoom(options)
}

// events dispatched on the svg go through svg.js' own event bag, which keeps
// the `target` of the synthetic event intact
const fireOn = (svg, ev) => svg.dispatchEvent(ev)

// the pan handlers are registered on the (svgdom) document node
const fireOnDocument = (ev) => document.dispatchEvent(ev)

const mouseDown = (target, extra = {}) => ({
  type: 'mousedown',
  button: 0,
  which: 1,
  clientX: 100,
  clientY: 100,
  preventDefault() {},
  ...extra,
  target
})

// stop a running pan so the document listeners are detached again
const stopPan = () => fireOnDocument({ type: 'mouseup', preventDefault() {} })

const countPanStarts = (svg) => {
  const counter = { count: 0 }
  svg.on('panStart', () => counter.count++)
  return counter
}

describe('panZoom() registration', () => {
  it('is registered on Svg instances', () => {
    assert.strictEqual(typeof SVG().panZoom, 'function')
  })

  it('is chainable', () => {
    const svg = SVG()
    assert.strictEqual(svg.panZoom(), svg)
    assert.strictEqual(svg.panZoom(false), svg)
  })
})

describe('panStart', () => {
  it('starts a pan on mousedown', () => {
    const svg = makeSvg()
    const panStarts = countPanStarts(svg)

    fireOn(svg, mouseDown(svg.rect(10, 10).node))

    assert.strictEqual(panStarts.count, 1)
    stopPan()
  })

  it('is cancelable: preventDefault stops the pan before it begins', () => {
    const svg = makeSvg()
    let panned = false
    svg.on('panning', () => {
      panned = true
    })
    svg.on('panStart', (ev) => ev.preventDefault())

    const text = svg.text('hello').node
    fireOn(svg, mouseDown(text))
    fireOnDocument({
      type: 'mousemove',
      clientX: 200,
      clientY: 200,
      preventDefault() {}
    })

    assert.strictEqual(panned, false)
    assert.strictEqual(svg.viewbox().x, 0)
  })

  it('leaves the original event alone when it is prevented', () => {
    const svg = makeSvg()
    let defaultPrevented = false
    svg.on('panStart', (ev) => ev.preventDefault())

    fireOn(
      svg,
      mouseDown(svg.text('hello').node, {
        preventDefault() {
          defaultPrevented = true
        }
      })
    )

    assert.strictEqual(defaultPrevented, false)
  })

  it('prevents the default of the original event when it pans', () => {
    const svg = makeSvg()
    let defaultPrevented = false

    fireOn(
      svg,
      mouseDown(svg.rect(10, 10).node, {
        preventDefault() {
          defaultPrevented = true
        }
      })
    )

    assert.strictEqual(defaultPrevented, true)
    stopPan()
  })
})

describe('afterZoom', () => {
  const wheel = (extra = {}) => ({
    type: 'wheel',
    deltaY: 120,
    deltaMode: 0,
    clientX: 500,
    clientY: 500,
    preventDefault() {},
    ...extra
  })

  it('is dispatched after the cancelable zoom event', () => {
    const svg = makeSvg()
    const order = []
    let detail
    svg.on('zoom', () => order.push('zoom'))
    svg.on('afterZoom', (ev) => {
      order.push('afterZoom')
      detail = ev.detail
    })

    fireOn(svg, wheel())

    assert.deepStrictEqual(order, ['zoom', 'afterZoom'])
    assert.strictEqual(detail.box.toString(), svg.viewbox().toString())
    assert.notStrictEqual(detail.box.width, 1000)
  })

  it('is not dispatched when the zoom event was prevented', () => {
    const svg = makeSvg()
    let dispatched = false
    svg.on('zoom', (ev) => ev.preventDefault())
    svg.on('afterZoom', () => {
      dispatched = true
    })

    fireOn(svg, wheel())

    assert.strictEqual(dispatched, false)
    assert.strictEqual(svg.viewbox().width, 1000)
  })

  it('carries the viewbox as restricted by the margins', () => {
    const svg = makeSvg({
      margins: { top: 100, left: 100, right: 100, bottom: 100 }
    })
    svg.node.preserveAspectRatio = { baseVal: { align: 1, meetOrSlice: 0 } }
    let detail
    svg.on('afterZoom', (ev) => {
      detail = ev.detail
    })

    fireOn(svg, wheel())

    assert.strictEqual(detail.box.toString(), svg.viewbox().toString())
  })

  it('is dispatched for pinch zoom as well', () => {
    const svg = makeSvg()
    let detail
    svg.on('afterZoom', (ev) => {
      detail = ev.detail
    })

    fireOn(svg, {
      type: 'touchstart',
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 }
      ],
      preventDefault() {}
    })
    fireOnDocument({
      type: 'touchmove',
      touches: [
        { clientX: 110, clientY: 110 },
        { clientX: 210, clientY: 210 }
      ],
      preventDefault() {}
    })

    assert.strictEqual(detail.box.toString(), svg.viewbox().toString())
  })
})
