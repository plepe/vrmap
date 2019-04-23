const turf = require('@turf/turf')

module.exports = {
  init () {
  },

  load (context, callback) {
    overpassFrontend.BBoxQuery(
      '(way[railway=tram];)',
      context.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
      },
      (err, feature) => {
        this.addItem(feature.GeoJSON(), context)
      },
      callback
    )
  },

  addItem (feature, context) {
    if (!feature.geometry) {
      console.log(feature)
      return
    }

    let gauge = feature.properties.gauge || 1435

    let metaitem = document.createElement('a-entity')

    let shifted = turf.lineOffset(feature, gauge / 2000, { units: 'meters' })
    let geom = context.convertFromGeoJSON(shifted)
    geom = geom.geometry.coordinates
    let item = document.createElement('a-tube')
    item.setAttribute('class', 'tracks')
    item.setAttribute('path', geom.map(pos => pos.x + ' 0 ' + pos.z).join(', '))
    item.setAttribute('radius', 0.05)
    item.setAttribute('material', { color: '#404040' })
    item.setAttribute('segments', geom.length * 2)
    metaitem.appendChild(item)

    shifted = turf.lineOffset(feature, -gauge / 2000, { units: 'meters' })
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
  },

  clear () {
  }
}
