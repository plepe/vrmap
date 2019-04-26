/* global OverpassFrontend, overpassFrontend */

class OverpassFeatures {
  constructor (view) {
    this.view = view
    this.request = undefined
    this.features = {}
  }

  load (callback) {
    let found = {}

    if (this.request) {
      this.request.abort()
    }

    if (!this.query) {
      return console.error('You have to set this.query to an Overpass Query')
    }

    this.request = overpassFrontend.BBoxQuery(
      this.query,
      this.view.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
      },
      (err, feature) => {
        if (err) {
          return console.error(err)
        }

        if (!(feature.id in this.features)) {
          this.features[feature.id] = {
            feature,
            data: this.addFeature(feature)
          }
        }

        found[feature.id] = true
      },
      (err) => {
        this.request = undefined

        for (let k in this.features) {
          if (!(k in found)) {
            this.removeFeature(this.features[k].feature, this.features[k].data)
            delete this.features[k]
          }
        }

        callback(err)
      }
    )
  }

  addFeature (feature) {
  }

  removeFeature (feature, data) {
  }
}

module.exports = OverpassFeatures
