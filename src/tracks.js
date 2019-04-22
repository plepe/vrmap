const turf = require('@turf/turf')
require('aframe-extras');

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

    geom = geom.geometry.coordinates.map(pos => getPositionFromTilepos(pos))

    let item = document.createElement("a-entity")
    item.setAttribute("class", "tracks")

    item.setAttribute("geometry", {primitive: "tube", radius: 1, "path": geom.map(pos => Math.floor(pos.x) + " 1 " + Math.floor(pos.z)).join(", ") })

    console.log(item)
    global.items.appendChild(item)

//
//    let data = getBuildingData(feature)
//    let buildingProperties = data.properties
//    buildingProperties.outerPoints = outerPoints
//    if (innerWays.length) {
//      buildingProperties.innerPaths = innerWays;
//    }
//    
//    item.setAttribute("geometry", buildingProperties);
//    item.setAttribute("material", {color: data.color})
//    item.setAttribute("position", getPositionFromTilepos(itemPos))
  },

  clear () {
  }
}
