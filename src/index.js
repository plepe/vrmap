const async = {
  each: require('async/each')
}

const Context = require('./Context')

const modules = [
  require('./buildings'),
  require('./trees'),
  require('./tracks'),
  require('./routes')
]

let context
let camera
let cameraPos
let worldPos, oldWorldPos
let rotation, oldRotation

global.init = () => {
  modules.forEach(module => module.init())

  camera = document.querySelector("#head")

  worldPos = new THREE.Vector3()
}

global.load = (param, callback) => {
  context = new Context(param)

  async.each(modules,
    (module, callback) => module.load(context, callback),
    callback
  )
}

function update () {
  console.log(cameraPos)
}

global.clear = () => {
  modules.forEach(module => module.clear())
}

AFRAME.registerComponent('camera-listener', {
  tick () {
    worldPos.setFromMatrixPosition(camera.object3D.matrixWorld)
    rotation = camera.getAttribute('rotation')
    const newWorldPos = AFRAME.utils.coordinates.stringify(worldPos)
    const newRotation = AFRAME.utils.coordinates.stringify(rotation)
    
    if (oldWorldPos !== newWorldPos || oldRotation !== newRotation) {
      cameraPos = context.latlonFromWorldpos(worldPos)
      cameraPos.heading = rotation.y % 360
      if (cameraPos.angle < 0) {
        cameraPos.heading += 360
      }

      update()

      oldWorldPos = newWorldPos
      oldRotation = newRotation
    }
  }
})
