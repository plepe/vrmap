const OverpassLayer = require('../OverpassLayer')

module.exports = class Tracks extends OverpassLayer {
  constructor (view) {
    super(view)
    this.query = 'way[railway=tram]'
  }

  addFeature (geometry, options) {
    let metaitem = document.createElement('a-entity')

    let item = document.createElement('a-tube')
    item.setAttribute('class', 'tracks')
    item.setAttribute('path', geometry.right)
    item.setAttribute('radius', 0.05)
    item.setAttribute('material', { color: '#404040' })
    item.setAttribute('segments', geometry.right.length * 2)
    metaitem.appendChild(item)

    item = document.createElement('a-tube')
    item.setAttribute('class', 'tracks')
    item.setAttribute('path', geometry.left)
    item.setAttribute('radius', 0.05)
    item.setAttribute('material', { color: '#404040' })
    item.setAttribute('segments', geometry.left.length * 2)
    metaitem.appendChild(item)

    global.items.appendChild(metaitem)

    return metaitem
  }

  removeFeature (metaitem) {
    global.items.removeChild(metaitem)
  }
}
