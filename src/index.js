/* global AFRAME, THREE, OverpassFrontend, fetch, presetsFile, centerPos, baseTileID, overpassFrontend, overpassURL, baseTileSize, tilesizeFromID */

const turf = require('@turf/turf')
const async = {
  each: require('async/each')
}

const Context = require('./Context')
const pointToGeoJSON = require('./pointToGeoJSON')

const modules = [
  require('./Tiles'),
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

window.onload = function () {
  overpassFrontend = new OverpassFrontend(overpassURL)

  // Close intro dialog on clicking its button.
  document.querySelector('#introDialogCloseButton').onclick = event => {
    event.target.parentElement.parentElement.classList.add('hidden')
  }
  // Close intro dialog when entering VR mode.
  document.querySelector('a-scene').addEventListener('enter-vr', event => {
    document.querySelector('#introDialogCloseButton').click()
  })

  // Load location presets and subdialog.
  fetch(presetsFile)
    .then((response) => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error('HTTP Error ' + response.status)
      }
    })
    .then((locationPresets) => {
      let presetSel = document.querySelector('#locationPresets')
      let menu = document.querySelector('#menu')
      let locLatInput = document.querySelector('#locLatitude')
      let locLonInput = document.querySelector('#locLongitude')
      presetSel.onchange = function (event) {
        if (event.target.selectedIndex >= 0 && event.target.value >= 0) {
          let preset = locationPresets[event.target.value]
          locLatInput.value = preset.latitude
          locLonInput.value = preset.longitude
        } else {
          locLatInput.value = ''
          locLonInput.value = ''
          if (event.target.value === -2) {
            navigator.geolocation.getCurrentPosition(pos => {
              locLatInput.value = pos.coords.latitude
              locLonInput.value = pos.coords.longitude
            })
          }
        }
      }
      let mItemHeight = 0.1
      let normalBgColor = '#404040'
      let normalTextColor = '#CCCCCC'
      let hoverBgColor = '#606060'
      let hoverTextColor = 'yellow'
      let menuHeight = mItemHeight * locationPresets.length
      menu.setAttribute('height', menuHeight)
      menu.setAttribute('position', { x: 0, y: 1.6 - menuHeight / 6, z: -1 })
      for (let i = -2; i < locationPresets.length; i++) {
        var opt = document.createElement('option')
        opt.value = i
        if (i === -2) { opt.text = 'Get Your Location' } else if (i === -1) { opt.text = 'Set Custom Location' } else { opt.text = locationPresets[i].title }
        presetSel.add(opt, null)
        if (i >= 0) {
        // menu entity
          var menuitem = document.createElement('a-box')
          menuitem.setAttribute('position', { x: 0, y: menuHeight / 2 - (i + 0.5) * mItemHeight, z: 0 })
          menuitem.setAttribute('height', mItemHeight)
          menuitem.setAttribute('depth', 0.001)
          menuitem.setAttribute('text', { value: opt.text, color: normalTextColor, xOffset: 0.03 })
          menuitem.setAttribute('color', normalBgColor)
          menuitem.setAttribute('data-index', i)
          menuitem.addEventListener('mouseenter', event => {
            event.target.setAttribute('text', { color: hoverTextColor })
            event.target.setAttribute('color', hoverBgColor)
          })
          menuitem.addEventListener('mouseleave', event => {
            event.target.setAttribute('text', { color: normalTextColor })
            event.target.setAttribute('color', normalBgColor)
          })
          menuitem.addEventListener('click', event => {
            let preset = locationPresets[event.target.dataset.index]
            centerPos.latitude = preset.latitude
            centerPos.longitude = preset.longitude
            loadScene()
          })
          menu.appendChild(menuitem)
        }
      }
      centerPos = { latitude: locationPresets[0].latitude,
        longitude: locationPresets[0].longitude }
      presetSel.value = 0
      locLatInput.value = centerPos.latitude
      locLonInput.value = centerPos.longitude
      document.querySelector('#locationLoadButton').onclick = event => {
        centerPos.latitude = locLatInput.valueAsNumber
        centerPos.longitude = locLonInput.valueAsNumber
        loadScene()
      }

      init()

      // Load objects into scene.
      loadScene()
    })
    .catch((reason) => { console.log(reason) })

  // Hook up menu button iside the VR.
  let leftHand = document.querySelector('#left-hand')
  let rightHand = document.querySelector('#right-hand')
  // Vive controllers, Windows Motion controllers
  leftHand.addEventListener('menudown', toggleMenu, false)
  rightHand.addEventListener('menudown', toggleMenu, false)
  // Oculus controllers (guessing on the button)
  leftHand.addEventListener('surfacedown', toggleMenu, false)
  rightHand.addEventListener('surfacedown', toggleMenu, false)
  // Daydream and GearVR controllers - we need to filter as Vive and Windows Motion have the same event.
  var toggleMenuOnStandalone = function (event) {
    if (event.target.components['daydream-controls'].controllerPresent ||
        event.target.components['gearvr-controls'].controllerPresent) {
      toggleMenu(event)
    }
  }
  leftHand.addEventListener('trackpaddown', toggleMenuOnStandalone, false)
  rightHand.addEventListener('trackpaddown', toggleMenuOnStandalone, false)
  // Keyboard press
  document.querySelector('body').addEventListener('keydown', event => {
    if (event.key === 'm') { toggleMenu(event) }
  })

  // Set variables for base objects.
  global.map = document.querySelector('#map')
  global.tiles = document.querySelector('#tiles')
  global.items = document.querySelector('#items')
}

function toggleMenu (event) {
  console.log('menu pressed!')
  let menu = document.querySelector('#menu')
  if (menu.getAttribute('visible') === false) {
    menu.setAttribute('visible', true)
    document.querySelector('#left-hand').setAttribute('mixin', 'handcursor')
    document.querySelector('#right-hand').setAttribute('mixin', 'handcursor')
  } else {
    menu.setAttribute('visible', false)
    document.querySelector('#left-hand').setAttribute('mixin', 'teleport')
    document.querySelector('#right-hand').setAttribute('mixin', 'teleport')
  }
}

function init () {
  if (!context) {
    context = new Context({
      centerPos
    })
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

function loadScene () {
  document.querySelector('#cameraRig').object3D.position.set(0, 0, 0)
  context.centerPos = centerPos

  baseTileID = context.tileIDFromLatlon(context.centerPos)
  baseTileSize = tilesizeFromID(baseTileID)

  clear()
  cameraListener(true)
  load(() => {})
}

function clear () {
  layers.forEach(layer => layer.clear())
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
  context.cameraPos = cameraPos
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
    cameraListener()
  }
})

function cameraListener (force = false) {
  if (worldPos === undefined) {
    return
  }

  worldPos.setFromMatrixPosition(camera.object3D.matrixWorld)

  rotation = camera.getAttribute('rotation')
  const newWorldPos = AFRAME.utils.coordinates.stringify(worldPos)
  const newRotation = AFRAME.utils.coordinates.stringify(rotation)

  if (force || oldWorldPos !== newWorldPos || oldRotation !== newRotation) {
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
