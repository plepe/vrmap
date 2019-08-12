const OverpassFronted = require('overpass-frontend')
const turf = require('@turf/turf')

const Context = require('./Context')
const pointToGeoJSON = require('./pointToGeoJSON')

const modules = require('./worker-modules/all')

let layers = {}
let context = new Context()

function getBBox (cameraPos) {
  let cameraGeoJSON = pointToGeoJSON(cameraPos)
  let viewArea = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ [
        cameraGeoJSON.geometry.coordinates,
        turf.transformTranslate(cameraGeoJSON, context.config.viewDistance / 1000, -cameraPos.heading + context.config.viewAngle / 2).geometry.coordinates,
        turf.transformTranslate(cameraGeoJSON, context.config.viewDistance / 1000, -cameraPos.heading - context.config.viewAngle / 2).geometry.coordinates,
        cameraGeoJSON.geometry.coordinates
      ] ]
    }
  }

  return turf.buffer(viewArea, context.config.viewBuffer / 1000)
}

function setCameraPos (cameraPos) {
  let viewArea = getBBox(cameraPos)
  let bbox = turf.bbox(viewArea)
  bbox = {
    minlon: bbox[0],
    minlat: bbox[1],
    maxlon: bbox[2],
    maxlat: bbox[3]
  }

  for (let k in layers) {
    layers[k].load(bbox, () => {})
  }
}

function init (_config) {
  context.config = _config

  global.overpassFrontend = new OverpassFronted(context.config.overpassURL)
}

onmessage = (e) => {
  switch (e.data.fun) {
    case 'init':
      init(e.data.config)
      return
    case 'addLayer':
      let Module = modules[e.data.id]
      let layer = new Module(e.data.id, e.data.query, context)
      layers[e.data.id] = layer
      return
    case 'setCenterPos':
      return context.setCenterPos(e.data.centerPos)
    case 'cameraPos':
      return setCameraPos(e.data.cameraPos)
  }
}
