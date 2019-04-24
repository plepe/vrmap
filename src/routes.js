const turf = require('@turf/turf')
const md5 = require('md5')

let routes = []

class Route {
  constructor (feature, context) {
    this.feature = feature
    this.context = context

    // settings
    this.interval = 60 // every n seconds
    this.speed = 0.005 // kilometer / second
    this.color = this.feature.tags.color || '#' + md5(this.feature.tags.ref).slice(0, 6)

    // make sure that all route members are fully loaded (including connections to prev/next way)
    let routeWayIds = []
    feature.members.forEach(
      member => {
        if (member.role === '' && member.type === 'way') {
          routeWayIds.push(member.id)
        }
      }
    )

    overpassFrontend.get(
      routeWayIds,
      {
        properties: OverpassFrontend.MEMBERS
      },
      () => {},
      () => this.init()
    )
  }

  init () {
    let routeFeatures = []
    let routeGeom = []

    this.feature.members.forEach(
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
    item.setAttribute('radius', 1.5)
    item.setAttribute('material', { color: this.color })

    let vehicle = {
      item,
      pos,
      visible: false
    }
    this.vehicles.push(vehicle)
    this.updateVehicle(vehicle)
  }

  updateVehicle (vehicle) {
    let latlon = turf.along(this.routeJsonFeature, vehicle.pos)

    if (this.context.bbox.intersects(latlon)) {
      let coordinates = this.context.convertFromGeoJSON(latlon).geometry.coordinates
      vehicle.item.setAttribute('position', coordinates.x + ' 1 ' + coordinates.z)

      if (!vehicle.visible) {
        global.items.appendChild(vehicle.item)
        vehicle.visible = true
      }
    } else {
      if (vehicle.visible) {
        global.items.removeChild(vehicle.item)
        vehicle.visible = false
      }
    }
  }

  moveVehicles (elapsed) {
    if (this.routeLength === undefined) {
      return
    }

    let minPos = this.routeLength

    this.vehicles.forEach((vehicle, i) => {
      vehicle.pos += elapsed * this.speed

      if (vehicle.pos < minPos) {
        minPos = vehicle.pos
      }

      if (vehicle.pos > this.routeLength) {
        if (vehicle.visible) {
          global.items.removeChild(vehicle.item)
        }

        this.vehicles.splice(i, 1)
        return
      }

      this.updateVehicle(vehicle)
    })

    let distance = this.interval * this.speed
    for (let i = minPos - distance; i >= 0; i -= distance) {
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
        properties: OverpassFrontend.GEOM | OverpassFrontend.MEMBERS | OverpassFrontend.TAGS
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
    let time = new Date().getTime()
    let elapsed = 0
    if (this.lastUpdateTime) {
      elapsed = (time - this.lastUpdateTime) / 1000
    }
    this.lastUpdateTime = time

    routes.forEach(route => route.moveVehicles(elapsed))
  }
}
