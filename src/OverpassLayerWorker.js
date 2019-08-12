const OverpassFrontend = require('overpass-frontend')
const async = {
  each: require('async/each')
}

class OverpassFeatures {
  constructor (id, query, view) {
    this.request = undefined
    this.features = {}
    this.id = id
    this.query = query
    this.view = view
  }

  load (bbox, callback) {
    let found = {}

    if (this.request) {
      this.request.abort()
    }

    if (!this.query) {
      return console.error('You have to set this.query to an Overpass Query')
    }

    this.request = global.overpassFrontend.BBoxQuery(
      this.query,
      bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
      },
      (err, feature) => {
        if (err) {
          return console.error(err)
        }

        if (!(feature.id in this.features)) {
          this.features[feature.id] = {
            feature
          }

          let geojson = feature.GeoJSON()
          let { geometry, options } = this.calc(geojson, feature)
          postMessage({ fun: 'add', id: this.id, featureId: feature.id, geometry, options })
        }

        found[feature.id] = true
      },
      (err) => {
        this.request = undefined

        for (let k in this.features) {
          if (!(k in found)) {
            postMessage({ fun: 'remove', id: this.id, featureId: k })
            delete this.features[k]
          }
        }

        callback(err)
      }
    )
  }
}

module.exports = OverpassFeatures
