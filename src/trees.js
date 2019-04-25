/* global OverpassFrontend, overpassFrontend, AFRAME, THREE */

let request
let items = {}

module.exports = {
  init () {
  },

  load (context, callback) {
    let found = {}

    if (request) {
      request.abort()
    }

    request = overpassFrontend.BBoxQuery(
      'node[natural=tree]',
      context.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.TAGS
      },
      (err, feature) => {
        if (err) {
          return console.error(err)
        }

        if (!(feature.id in items)) {
          this.addItem(feature, context)
        }

        found[feature.id] = true
      },
      (err) => {
        request = null

        for (let k in items) {
          if (!(k in found)) {
            global.items.removeChild(items[k])
            delete items[k]
          }
        }

        callback(err)
      }
    )
  },

  addItem (feature, context) {
    let itemPos = context.convertFromGeoJSON(feature.GeoJSON()).geometry.coordinates

    var tags = feature.tags || {}
    var item = document.createElement('a-entity')
    item.setAttribute('class', 'tree')
    var trunk = document.createElement('a-entity')
    trunk.setAttribute('class', 'trunk')
    var crown = document.createElement('a-entity')
    crown.setAttribute('class', 'crown')
    var height = tags.height ? tags.height : 8
    var trunkRadius = (tags.circumference ? tags.circumference : 1) / 2 / Math.PI
    var crownRadius = (tags.diameter_crown ? tags.diameter_crown : 3) / 2
    // leaf_type is broadleaved, needleleaved, mixed or rarely something else.
    if (tags['leaf_type'] == 'needleleaved') { // special shape for needle-leaved trees
      var trunkHeight = height * 0.5
      var crownHeight = height * 0.8
      trunk.setAttribute('geometry', { primitive: 'cylinder', height: trunkHeight, radius: trunkRadius })
      trunk.setAttribute('material', { color: '#b27f36' })
      trunk.setAttribute('position', { x: 0, y: (trunkHeight / 2), z: 0 })
      crown.setAttribute('geometry', { primitive: 'cone', height: crownHeight, radiusBottom: crownRadius, radiusTop: 0 })
      crown.setAttribute('material', { color: '#80ff80' })
      crown.setAttribute('position', { x: 0, y: (height - crownHeight / 2), z: 0 })
    } else { // use a simple typical broadleaved-type shape
      var trunkHeight = height - crownRadius
      trunk.setAttribute('geometry', { primitive: 'cylinder', height: trunkHeight, radius: trunkRadius })
      trunk.setAttribute('material', { color: '#b27f36' })
      trunk.setAttribute('position', { x: 0, y: (trunkHeight / 2), z: 0 })
      crown.setAttribute('geometry', { primitive: 'sphere', radius: crownRadius })
      crown.setAttribute('material', { color: '#80ff80' })
      crown.setAttribute('position', { x: 0, y: trunkHeight, z: 0 })
    }
    item.setAttribute('position', itemPos)
    item.setAttribute('data-gpspos', feature.geometry.lat + '/' + feature.geometry.lon)
    item.appendChild(trunk)
    item.appendChild(crown)

    global.items.appendChild(item)

    items[feature.id] = item
  },

  clear () {
  }
}
