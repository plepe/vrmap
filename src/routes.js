const turf = require('@turf/turf')

let routes = []

class Route {
  constructor (feature, context) {
    this.feature = feature
    this.context = context

    let routeFeatures = []
    let routeGeom = []

    feature.members.forEach(
      member => {
        if (member.role === '' && member.type === 'way') {
          routeFeatures.push(member)

          if (member.dir === 'backward') {
            routeGeom = routeGeom.concat(member.geometry.reverse().slice(member.connectedPrev === 'no' ? 0 : 1))
          } else {
            routeGeom = routeGeom.concat(member.geometry.slice(member.connectedPrev === 'no' ? 0 : 1))
          }
        }
      }
    )

    this.routeJsonFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeGeom.map(pos => [ pos.lon, pos.lat ])
      }
    }
    this.routeLength = turf.length(this.routeJsonFeature)

    this.vehicles = []
  }

  addVehicle (pos) {
    let item = document.createElement('a-sphere')
    item.setAttribute('class', 'vehicle')
    let coordinates = this.context.convertFromGeoJSON(turf.along(this.routeJsonFeature, pos)).geometry.coordinates
    item.setAttribute('position', coordinates.x + ' 1 ' + coordinates.z)
    item.setAttribute('radius', 10)
    item.setAttribute('material', { color: 'red' })

    this.vehicles.push({
      item,
      pos
    })

    global.items.appendChild(item)
  }

  moveVehicles () {
    let minPos = this.routeLength

    this.vehicles.forEach((vehicle, i) => {
      vehicle.pos += 0.001

      if (vehicle.pos < minPos) {
        minPos = vehicle.pos
      }

      if (vehicle.pos > this.routeLength) {
        global.items.removeChild(vehicle.item)
        this.vehicles.splice(i, 1)
        return
      }

      let coordinates = this.context.convertFromGeoJSON(turf.along(this.routeJsonFeature, vehicle.pos)).geometry.coordinates
      vehicle.item.setAttribute('position', coordinates.x + ' 1 ' + coordinates.z)
    })

    for (let i = 0; i < minPos - 1; i += 1) {
      this.addVehicle(i)
    }
  }
}

module.exports = {
  init () {
  },

  load (context, callback) {
    overpassFrontend.BBoxQuery(
      'relation[route=tram]',
      context.bbox,
      {
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS,
        members: true,
        memberCallback: () => {},
        memberProperties: OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
      },
      (err, feature) => {
        this.addItem(feature, context)
      },
      callback
    )

    window.setInterval(() => this.update(), 20)
  },

  addItem (feature, context) {
    routes.push(new Route(feature, context))
  },

  clear () {
  },

  update () {
    routes.forEach(route => route.moveVehicles())
  }
}
