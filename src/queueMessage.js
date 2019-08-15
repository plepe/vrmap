/* global postMessage:false */

let messages = []
function queueMessage (data) {
  messages.push(data)
}

global.setInterval(() => {
  // maximum 5 messages per tick
  for (let i = [5, messages.length].sort()[0]; i > 0; i--) {
    postMessage(messages.shift())
  }
}, 10)

module.exports = queueMessage
