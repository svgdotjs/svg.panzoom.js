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
