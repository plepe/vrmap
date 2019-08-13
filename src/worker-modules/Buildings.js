const OverpassLayerWorker = require('../OverpassLayerWorker')

var metersPerLevel = 3
var roofOnlyTypes = ['roof', 'carport', 'grandstand']
var ignoredTypes = ['entrance', 'collapsed', 'destroyed', 'proposed', 'no']
var singleLevelTypes = ['grandstand', 'houseboat', 'bungalow', 'static_caravan',
  'kiosk', 'cabin', 'chapel', 'shrine', 'bakehouse', 'bridge', 'bunker',
  'carport', 'cowshed', 'garage', 'garages', 'gabage_shed', 'hut', 'roof',
  'shed', 'stable', 'sty', 'service', 'shelter']
var specialDefaults = {
  construction: { 'building:colour': '#808080' },
  house: { 'building:levels': 2 },
  farm: { 'building:levels': 2 },
  detached: { 'building:levels': 2 },
  terrace: { 'building:levels': 2 },
  transformer_tower: { 'height': 10 },
  water_tower: { 'height': 20 }
}

module.exports = class Buildings extends OverpassLayerWorker {
  calc (feature) {
    let geometry = { itemPos: null, parts: [] }
    let itemPos

    let geom = this.view.convertFromGeoJSON(feature.GeoJSON())
    if (!geom.geometry) {
      console.log(feature)
      return
    }

    if (geom.geometry.type === 'LineString') {
      geom.geometry.type = 'Polygon'
      geom.geometry.coordinates = [ geom.geometry.coordinates ]
    }

    let options = getBuildingData(feature)
    if (options === null) {
      return
    }

    let item
    if (geom.geometry.type === 'Polygon') {
      itemPos = geom.geometry.coordinates[0][0]
      geometry.parts = [ this.createGeometry(geom.geometry.coordinates, options, itemPos) ]
    } else if (geom.geometry.type === 'MultiPolygon') {
      itemPos = geom.geometry.coordinates[0][0][0]

      for (let i = 0; i < geom.geometry.coordinates.length; i++) {
        geometry.parts.push(this.createGeometry(geom.geometry.coordinates[i], options, itemPos))
      }
    } else {
      console.error('Buildings: can\'t handle geometry ' + geom.geometry.type + ', object ' + feature.id)
      return
    }

    geometry.itemPos = itemPos
    return { geometry, options }
  }

  createGeometry (coordinates, data, itemPos) {
    var outerPoints = []
    var innerWays = []
    for (let way of coordinates) {
      let wayPoints = []
      for (let tpos of way) {
        let ppos = this.view.getRelativePositionFromWorldpos(tpos, itemPos)
        wayPoints.push({ x: ppos.x, y: ppos.z })
      }
      if (!outerPoints.length) {
        outerPoints = wayPoints
      } else {
        innerWays.push(wayPoints)
      }
    }

    let buildingProperties = {}
    Object.assign(buildingProperties, data.properties)
    buildingProperties.outerPoints = outerPoints
    if (innerWays.length) {
      buildingProperties.innerPaths = innerWays
    }

    return buildingProperties
  }
}

function getBuildingData (feature) {
  var tags = feature.tags || {}
  var btype = tags.building
  if (tags.shelter === 'yes') { btype = 'shelter' }
  if (ignoredTypes.includes(btype)) { return null }

  var height = tags.height ? tags.height : null
  if (!height && tags['building:levels']) {
    height = tags['building:levels'] * metersPerLevel
  } else if (!height && btype in specialDefaults && specialDefaults[btype].height) {
    height = specialDefaults[btype].height
  } else if (!height && btype in specialDefaults && specialDefaults[btype]['building:levels']) {
    height = specialDefaults[btype]['building:levels'] * metersPerLevel
  } else if (!height && singleLevelTypes.includes(btype)) {
    height = metersPerLevel // assume one level only
  }

  var minHeight = tags.min_height ? tags.min_height : null
  if (!minHeight && tags['building:min_level']) {
    minHeight = tags['building:min_level'] * metersPerLevel
  } else if (!minHeight && btype in specialDefaults && specialDefaults[btype]['building:min_level']) {
    minHeight = specialDefaults[btype]['building:min_level'] * metersPerLevel
  } else if (!minHeight && roofOnlyTypes.includes(btype)) {
    if (!height) { height = metersPerLevel /* assume one level only */ }
    minHeight = height - 0.3
  }

  var color = '#d9c0d9'
  if (tags['building:colour']) {
    color = tags['building:colour']
  } else if (btype in specialDefaults && specialDefaults[btype]['building:colour']) {
    color = specialDefaults[btype]['building:colour']
  }

  let buildingProperties = { primitive: 'building' }
  if (height) {
    buildingProperties.height = height
  }
  if (minHeight) {
    buildingProperties.minHeight = minHeight
  }

  return {
    properties: buildingProperties,
    color: color
  }
}
