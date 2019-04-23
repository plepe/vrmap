require('aframe')
require('aframe-animation-component')
require('aframe-teleport-controls')

const async = {
  each: require('async/each')
}

const modules = [
  require('./tracks')
]

global.init = () => {
  modules.forEach(module => module.init())
}

global.load = (context, callback) => {
  async.each(modules,
    (module, callback) => module.load(context, callback),
    callback
  )
}

global.clear = () => {
  modules.forEach(module => module.clear())
}
