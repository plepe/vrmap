const turf = require('@turf/turf')

const OverpassLayerWorker = require('../OverpassLayerWorker')

module.exports = class Tracks extends OverpassLayerWorker {
  calc (feature) {
    let options = {}
    let geometry = { left: null, right: null }

    let gauge = feature.tags.gauge || 1435
    let geojson = feature.GeoJSON()

    let shifted = turf.lineOffset(geojson, gauge / 2000, { units: 'meters' })
    let geom = this.view.convertFromGeoJSON(shifted)
    geometry.right = geom.geometry.coordinates.map(pos => pos.x + ' 0 ' + pos.z).join(', ')

    shifted = turf.lineOffset(geojson, -gauge / 2000, { units: 'meters' })
    geom = this.view.convertFromGeoJSON(shifted)
    geometry.left = geom.geometry.coordinates.map(pos => pos.x + ' 0 ' + pos.z).join(', ')

    return { geometry, options }
  }
}
