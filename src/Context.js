/* global tileZoom, baseTileID, baseTileSize, tileposFromLatlon, centerPos */
const BoundingBox = require('boundingbox')

let centerOffset

class Context {
  constructor (param) {
    for (var k in param) {
      this[k] = param[k]
    }
    this.bbox = new BoundingBox(this.bbox)
  }

  tileIDFromLatlon (latlon) {
    /* Get tile x/y numbers from degree-based latitude/longitude values */
    var n = Math.pow(2, tileZoom)
    var latRad = latlon.latitude / 180 * Math.PI
    var xtile = Math.floor(n * ((latlon.longitude + 180) / 360))
    var ytile = Math.floor(n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2)
    return { x: xtile, y: ytile }
  }

  worldposFromLatlon (latlon) {
    if (!centerOffset) {
      centerOffset = tileposFromLatlon(centerPos)
    }
    /* Get position x/z numbers from degree-based latitude/longitude values */
    var n = Math.pow(2, tileZoom)
    var latRad = latlon.latitude / 180 * Math.PI
    var xtilepos = n * ((latlon.longitude + 180) / 360)
    var ytilepos = n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2

    return {
      x: baseTileSize * (xtilepos - baseTileID.x - centerOffset.x),
      y: 0,
      z: baseTileSize * (ytilepos - baseTileID.y - centerOffset.y)
    }
  }

  getRelativePositionFromWorldpos (worldpos, reference) {
    return {
      x: worldpos.x - reference.x,
      y: 0,
      z: worldpos.z - reference.z
    }
  }

  convertFromGeoJSON (feature) {
    let result = {}
    for (var k in feature) {
      result[k] = feature[k]
    }

    if (feature.geometry) {
      switch (feature.geometry.type) {
        case 'Point':
          result.geometry = {
            type: feature.geometry.type,
            coordinates: this.worldposFromLatlon({
              longitude: feature.geometry.coordinates[0],
              latitude: feature.geometry.coordinates[1]
            })
          }
          break
        case 'LineString':
          result.geometry = {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates.map(
              pos => this.worldposFromLatlon({
                longitude: pos[0],
                latitude: pos[1]
              })
            )
          }
          break
        case 'Polygon':
          result.geometry = {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates.map(
              coord => coord.map(
                pos => this.worldposFromLatlon({
                  longitude: pos[0],
                  latitude: pos[1]
                })
              )
            )
          }
          break
        case 'GeometryCollection':
          result.geometries = {
            type: feature.geometry.type,
            geometry: feature.geometry.geometries.map(
              geom => this.convertFromGeoJSON({
                type: 'Feature',
                geometry: geom
              }).geometry
            )
          }
          break
        default:
          console.log("Can't convert " + feature.geometry.type)
      }
    }

    return result
  }
}

module.exports = Context
