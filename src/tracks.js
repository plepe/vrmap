const turf = require('@turf/turf')

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
      '(way[railway=tram];)',
      context.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
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
    if (!feature.geometry) {
      console.log(feature)
      return
    }

    let geojson = feature.GeoJSON()
    let gauge = feature.tags.gauge || 1435

    let metaitem = document.createElement('a-entity')

    let shifted = turf.lineOffset(geojson, gauge / 2000, { units: 'meters' })
    let geom = context.convertFromGeoJSON(shifted)
    geom = geom.geometry.coordinates
    let item = document.createElement('a-tube')
    item.setAttribute('class', 'tracks')
    item.setAttribute('path', geom.map(pos => pos.x + ' 0 ' + pos.z).join(', '))
    item.setAttribute('radius', 0.05)
    item.setAttribute('material', { color: '#404040' })
    item.setAttribute('segments', geom.length * 2)
    metaitem.appendChild(item)

    shifted = turf.lineOffset(geojson, -gauge / 2000, { units: 'meters' })
    geom = context.convertFromGeoJSON(shifted)
    geom = geom.geometry.coordinates
    item = document.createElement('a-tube')
    item.setAttribute('class', 'tracks')
    item.setAttribute('path', geom.map(pos => pos.x + ' 0 ' + pos.z).join(', '))
    item.setAttribute('radius', 0.05)
    item.setAttribute('material', { color: '#404040' })
    item.setAttribute('segments', geom.length * 2)
    metaitem.appendChild(item)

    global.items.appendChild(metaitem)

    items[feature.id] = metaitem
  },

  clear () {
  }
}
