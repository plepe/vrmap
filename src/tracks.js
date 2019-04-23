const turf = require('@turf/turf')

module.exports = {
  init () {
  },

  load (context, callback) {
    overpassFrontend.BBoxQuery(
      '(way[railway=tram];)',
      context.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS
      },
      (err, feature) => {
        this.addItem(feature.GeoJSON(), context)
      },
      callback
    )
  },

  addItem (feature, context) {
    let geom = context.convertFromGeoJSON(feature)
    if (!geom.geometry) {
      console.log(feature)
      return
    }

    geom = geom.geometry.coordinates

    let item = document.createElement("a-tube")
    item.setAttribute("class", "tracks")
    item.setAttribute("path", geom.map(pos => pos.x + " 0 " + pos.z).join(", "))

    item.setAttribute("radius", 0.05)
    item.setAttribute("material", { color: '#404040' })

    global.items.appendChild(item)
  },

  clear () {
  }
}
