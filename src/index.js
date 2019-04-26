/* global AFRAME, THREE */

const turf = require('@turf/turf')
const async = {
  each: require('async/each')
}

const Context = require('./Context')
const pointToGeoJSON = require('./pointToGeoJSON')

const modules = [
  require('./Buildings'),
  require('./Trees'),
  require('./Tracks'),
  require('./Routes')
]

let context
let camera
let cameraPos
let worldPos, oldWorldPos
let rotation, oldRotation
let layers = []

let viewAngle = 70
let viewDistance = 500 // m
let viewBuffer = 100 // m

global.init = () => {
  if (!context) {
    context = new Context({})
  }

  modules.forEach(Module => {
    layers.push(new Module(context))
  })

  camera = document.querySelector('#head')

  worldPos = new THREE.Vector3()
}

function load (callback) {
  async.each(layers,
    (layer, callback) => layer.load(callback),
    callback
  )
}

function getBBox () {
  let cameraGeoJSON = pointToGeoJSON(cameraPos)
  let viewArea = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ [
        cameraGeoJSON.geometry.coordinates,
        turf.transformTranslate(cameraGeoJSON, viewDistance / 1000, -cameraPos.heading + viewAngle / 2).geometry.coordinates,
        turf.transformTranslate(cameraGeoJSON, viewDistance / 1000, -cameraPos.heading - viewAngle / 2).geometry.coordinates,
        cameraGeoJSON.geometry.coordinates
      ] ]
    }
  }

  return turf.buffer(viewArea, viewBuffer / 1000)
}

function update () {
  context.viewArea = getBBox()
  let bbox = turf.bbox(context.viewArea)
  context.bbox.minlon = bbox[0]
  context.bbox.minlat = bbox[1]
  context.bbox.maxlon = bbox[2]
  context.bbox.maxlat = bbox[3]

  load(() => {})
}

AFRAME.registerComponent('camera-listener', {
  tick () {
    if (worldPos === undefined) {
      return
    }

    worldPos.setFromMatrixPosition(camera.object3D.matrixWorld)

    rotation = camera.getAttribute('rotation')
    const newWorldPos = AFRAME.utils.coordinates.stringify(worldPos)
    const newRotation = AFRAME.utils.coordinates.stringify(rotation)

    if (oldWorldPos !== newWorldPos || oldRotation !== newRotation) {
      cameraPos = context.latlonFromWorldpos(worldPos)
      cameraPos.heading = rotation.y % 360
      if (cameraPos.angle < 0) {
        cameraPos.heading += 360
      }

      update()

      oldWorldPos = newWorldPos
      oldRotation = newRotation
    }
  }
})
