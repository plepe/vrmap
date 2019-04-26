/* global OverpassFrontend, overpassFrontend, AFRAME, THREE */

const turf = require('@turf/turf')
const md5 = require('md5')

const OverpassLayer = require('./OverpassLayer')

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

  remove () {
    this.vehicles.forEach(vehicle => {
      if (vehicle.visible) {
        global.items.removeChild(vehicle.item)
      }
    })

    delete this.vehicles
  }
}

module.exports = class Routes extends OverpassLayer {
  constructor (view) {
    super(view)
    window.setInterval(() => this.update(), 20)
    this.query = 'relation[route=tram]'
  }

  addFeature (feature) {
    super.addFeature(feature)
    routes[feature.id] = new Route(feature, this.view)
    return routes[feature.id]
  }

  removeFeature (feature, route) {
    super.removeFeature(feature, route)
    route.remove()
    delete routes[feature.id]
  }

  update () {
    let time = new Date().getTime()
    let elapsed = 0
    if (this.lastUpdateTime) {
      elapsed = (time - this.lastUpdateTime) / 1000
    }
    this.lastUpdateTime = time

    for (var k in routes) {
      routes[k].moveVehicles(elapsed)
    }
  }
}
