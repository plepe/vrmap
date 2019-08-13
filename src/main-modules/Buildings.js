/* global AFRAME, THREE */
const OverpassLayer = require('../OverpassLayer')

module.exports = class Buildings extends OverpassLayer {
  constructor (view) {
    super(view)
    this.query = '(way[building];relation[building];)'
  }

  addFeature (geom, options) {
    let item = document.createElement('a-entity')
    item.setAttribute('class', 'building')

    geom.parts.forEach(part => {
      let subItem = document.createElement('a-entity')

      subItem.setAttribute('geometry', part)
      subItem.setAttribute('material', { color: options.color })
      subItem.setAttribute('position', geom.itemPos)

      item.appendChild(subItem)
    })

    global.items.appendChild(item)

    return item
  }

  removeFeature (feature, item) {
    if (item) {
      global.items.removeChild(item)
    }
  }
}

AFRAME.registerGeometry('building', {
  schema: {
    outerPoints: {
      parse: function (value) {
        if (typeof value === 'string' && value.length) {
          // e.g. "x1 y1, x2 y2, x3 y3, x4 y4"
          return value.split(',').map(val => AFRAME.utils.coordinates.parse(val))
        } else if (typeof value === 'object') {
          // assume we got an object we can use directly
          return value
        } else {
          return []
        }
      },
      default: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
    },
    innerPaths: {
      parse: function (value) {
        if (typeof value === 'string' && value.length) {
          // e.g. "x1 y1, x2 y2, x3 y3, x4 y4 / x5 y5, x6 y6, x7 y7" describes two paths (holes)
          return value.split('/').map(part => part.split(',').map(val => AFRAME.utils.coordinates.parse(val)))
        } else if (typeof value === 'object') {
          // assume we got an object we can use directly
          return value
        } else {
          return []
        }
      },
      default: []
    },
    height: { type: 'number', default: 0 },
    minHeight: { type: 'number', default: 0 }
  },

  init: function (data) {
    var shape = new THREE.Shape(data.outerPoints)
    var outerLength = shape.getLength()
    if (data.innerPaths.length) {
      for (let ipoints of data.innerPaths) {
        var holePath = new THREE.Path(ipoints)
        shape.holes.push(holePath)
      }
    }
    // Extrude from a 2D shape into a 3D object with a height.
    var height = data.height - data.minHeight
    if (!height) {
      height = Math.min(10, outerLength / 5)
    }
    var geometry = new THREE.ExtrudeGeometry(shape, { amount: height, bevelEnabled: false })
    // As Y is the coordinate going up, let's rotate by 90° to point Z up.
    geometry.rotateX(-Math.PI / 2)
    // Rotate around Y and Z as well to make it show up correctly.
    geometry.rotateY(Math.PI)
    geometry.rotateZ(Math.PI)
    // Now we would point under ground, move up the height, and any above-ground space as well.
    geometry.translate(0, height + data.minHeight, 0)
    this.geometry = geometry
  }
})
