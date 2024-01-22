import { mathjax } from 'mathjax-full/js/mathjax.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { DOMMimeTypeImageSvg, DomParse } from '../utils/dom'

const Adaptor = liteAdaptor()
RegisterHTMLHandler(Adaptor)


const mathjax_document = mathjax.document('', {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: 'local' })
})

const mathjax_options = {
  em: 12,
  ex: 6,
  containerWidth: 600
}

export function getMathjaxSvg(math: string, processString?: (svgText: string)=>string): Document {
  const node = mathjax_document.convert(math, mathjax_options)
  var svgText = Adaptor.innerHTML(node)
  if (processString) {
    svgText = processString(svgText)
  }
  return DomParse(svgText, DOMMimeTypeImageSvg);
}
