const OverpassFrontend = require('overpass-frontend')

class OverpassFeatures {
  constructor (id, query) {
    this.request = undefined
    this.features = {}
    this.id = id
    this.query = query
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
          postMessage({ fun: 'add', id: this.id, featureId: feature.id, feature: feature.GeoJSON() })
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
