const async = {
  each: require('async/each')
}

const Context = require('./Context')

const modules = [
  require('./buildings'),
  require('./tracks')
]

global.init = () => {
  modules.forEach(module => module.init())
}

global.load = (param, callback) => {
  let context = new Context(param)

  async.each(modules,
    (module, callback) => module.load(context, callback),
    callback
  )
}

global.clear = () => {
  modules.forEach(module => module.clear())
}
