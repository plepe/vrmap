const OverpassLayerWorker = require('../OverpassLayerWorker')

module.exports = class Trees extends OverpassLayerWorker {
  calc (feature) {
    let geometry = this.view.convertFromGeoJSON(feature.GeoJSON()).geometry.coordinates
    let tags = feature.tags

    let options = {
      height: tags.height ? tags.height : 8,
      trunkRadius: (tags.circumference ? tags.circumference : 1) / 2 / Math.PI,
      crownRadius: (tags.diameter_crown ? tags.diameter_crown : 3) / 2
    }

    if (tags['leaf_type'] === 'needleleaved') { // special shape for needle-leaved trees
      options.leaf_type = 'needleleaved'
      options.trunkHeight = options.height * 0.5
      options.crownHeight = options.height * 0.8
    } else {
      options.trunkHeight = options.height - options.crownRadius
    }

    return { geometry, options }
  }
}
