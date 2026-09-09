import win from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'
import '../src/svg.panzoom.js'

globalThis.window = win
globalThis.document = win.document
registerWindow(win, win.document)

let failures = 0
const assert = (condition, message) => {
  if (condition) {
    console.log(`ok   ${message}`)
  } else {
    failures++
    console.log(`FAIL ${message}`)
  }
}

const makeSvg = (options = {}, size = 1000) => {
  const svg = SVG().size(size, size).viewbox('0 0 1000 1000').panZoom(options)
  svg.node.clientWidth = size
  svg.node.clientHeight = size
  return svg
}

// svg-level handlers run through svg.js's own dispatchEvent so the `target`
// of the synthetic event is preserved
const fireOn = (svg, ev) => svg.dispatchEvent(ev)

// document-level handlers are registered on the (svgdom) document node
const fireOnDocument = (ev) => win.document.dispatchEvent(ev)

const makeMouseDown = (target, extra = {}) => ({
  type: 'mousedown',
  button: 0,
  which: 1,
  clientX: 100,
  clientY: 100,
  preventDefault () {},
  ...extra,
  target
})

const makeWheel = (extra = {}) => ({
  type: 'wheel',
  deltaY: 120,
  deltaMode: 0,
  clientX: 500,
  clientY: 500,
  preventDefault () {},
  ...extra
})

// Stop a running pan, detaching document listeners
const stopPan = () =>
  fireOnDocument({ type: 'mouseup', preventDefault () {} })

console.log('# registration')
{
  const svg = SVG()
  assert(typeof svg.panZoom === 'function', 'panZoom is registered on SVG instances')
  assert(svg.panZoom() === svg, 'panZoom() returns the instance (chainable)')
  assert(svg.panZoom(false) === svg, 'panZoom(false) disables and returns the instance')
}

console.log('# ignoreTextElements (default off)')
{
  const svg = makeSvg({})
  let panStarts = 0
  svg.on('panStart', () => panStarts++)

  const text = svg.text('hello').node
  fireOn(svg, makeMouseDown(text))
  assert(panStarts === 1, 'pan starts on text targets when ignoreTextElements is off (backward compatible)')
  stopPan()
}

console.log('# ignoreTextElements on non-text target')
{
  const svg = makeSvg({ ignoreTextElements: true })
  let panStarts = 0
  svg.on('panStart', () => panStarts++)

  const rect = svg.rect(10, 10, 100, 100).node
  fireOn(svg, makeMouseDown(rect))
  assert(panStarts === 1, 'pan still starts on non-text targets')
  stopPan()
}

console.log('# ignoreTextElements on text target')
{
  const svg = makeSvg({ ignoreTextElements: true })
  let panStarts = 0
  svg.on('panStart', () => panStarts++)

  const text = svg.text('hello').node
  fireOn(svg, makeMouseDown(text))
  assert(panStarts === 0, 'pan is ignored when the mousedown target is a text element')
}

console.log('# ignoreTextElements on tspan target')
{
  const svg = makeSvg({ ignoreTextElements: true })
  let panStarts = 0
  svg.on('panStart', () => panStarts++)

  const tspan = svg.text('hello').tspan(' world').node
  fireOn(svg, makeMouseDown(tspan))
  assert(panStarts === 0, 'pan is ignored when the mousedown target is a tspan inside text')
}

console.log('# ignoreTextElements on textPath target')
{
  const svg = makeSvg({ ignoreTextElements: true })
  let panStarts = 0
  svg.on('panStart', () => panStarts++)

  const text = svg.text('hello')
  const textPath = win.document.createElementNS('http://www.w3.org/2000/svg', 'textPath')
  textPath.setAttribute('href', '#path')
  text.node.appendChild(textPath)
  fireOn(svg, makeMouseDown(textPath))
  assert(panStarts === 0, 'pan is ignored when the mousedown target is a textPath')
}

console.log('# afterZoom (wheelZoom)')
{
  const svg = makeSvg({})
  const order = []
  let afterBox
  svg.on('zoom', () => order.push('zoom'))
  svg.on('afterZoom', ev => {
    order.push('afterZoom')
    afterBox = ev.detail.box
  })

  fireOn(svg, makeWheel())
  assert(order.join(',') === 'zoom,afterZoom', 'afterZoom is dispatched after zoom')
  assert(afterBox && afterBox.toString() === svg.viewbox().toString(), 'afterZoom carries the applied viewbox')
  assert(afterBox.width !== 1000, 'wheel zoom actually changed the viewbox')
}

console.log('# afterZoom respects margins')
{
  const svg = makeSvg({ margins: { top: 100, left: 100, right: 100, bottom: 100 } })
  svg.node.preserveAspectRatio = { baseVal: { align: 1, meetOrSlice: 0 } }
  let afterBox
  svg.on('afterZoom', ev => { afterBox = ev.detail.box })

  fireOn(svg, makeWheel())
  assert(afterBox && afterBox.toString() === svg.viewbox().toString(), 'afterZoom box equals the margin-restricted viewbox')
}

console.log('# afterZoom (pinchZoom)')
{
  const svg = makeSvg({})
  let afterBox
  svg.on('afterZoom', ev => { afterBox = ev.detail.box })

  const touches = [
    { clientX: 100, clientY: 100 },
    { clientX: 200, clientY: 200 }
  ]
  const pinchedTouches = [
    { clientX: 110, clientY: 110 },
    { clientX: 210, clientY: 210 }
  ]

  fireOn(svg, { type: 'touchstart', touches, preventDefault () {} })
  fireOnDocument({ type: 'touchmove', touches: pinchedTouches, preventDefault () {} })

  assert(afterBox && afterBox.toString() === svg.viewbox().toString(), 'afterZoom carries the viewbox applied by pinchZoom')
}

if (failures) {
  console.log(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nall tests passed')