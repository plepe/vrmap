const OverpassLayer = require('../OverpassLayer')

module.exports = class Trees extends OverpassLayer {
  constructor (view) {
    super(view)
    this.query = 'node[natural=tree]'
  }

  addFeature (itemPos, options) {
    var item = document.createElement('a-entity')
    item.setAttribute('class', 'tree')
    var trunk = document.createElement('a-entity')
    trunk.setAttribute('class', 'trunk')
    var crown = document.createElement('a-entity')
    crown.setAttribute('class', 'crown')
    // leaf_type is broadleaved, needleleaved, mixed or rarely something else.
    if (options.leaf_type === 'needleleaved') { // special shape for needle-leaved trees
      trunk.setAttribute('geometry', { primitive: 'cylinder', height: options.trunkHeight, radius: options.trunkRadius })
      trunk.setAttribute('material', { color: '#b27f36' })
      trunk.setAttribute('position', { x: 0, y: (options.trunkHeight / 2), z: 0 })
      crown.setAttribute('geometry', { primitive: 'cone', height: options.crownHeight, radiusBottom: options.crownRadius, radiusTop: 0 })
      crown.setAttribute('material', { color: '#80ff80' })
      crown.setAttribute('position', { x: 0, y: (options.height - options.crownHeight / 2), z: 0 })
    } else { // use a simple typical broadleaved-type shape
      trunk.setAttribute('geometry', { primitive: 'cylinder', height: options.trunkHeight, radius: options.trunkRadius })
      trunk.setAttribute('material', { color: '#b27f36' })
      trunk.setAttribute('position', { x: 0, y: (options.trunkHeight / 2), z: 0 })
      crown.setAttribute('geometry', { primitive: 'sphere', radius: options.crownRadius })
      crown.setAttribute('material', { color: '#80ff80' })
      crown.setAttribute('position', { x: 0, y: options.trunkHeight, z: 0 })
    }
    item.setAttribute('position', itemPos)
    //item.setAttribute('data-gpspos', feature.geometry.lat + '/' + feature.geometry.lon)
    item.appendChild(trunk)
    item.appendChild(crown)
    global.items.appendChild(item)

    return item
  }

  removeFeature (item) {
    global.items.removeChild(item)
  }
}
