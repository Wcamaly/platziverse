'use strict'
const http = require('http')
const express = require('express')
const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const path = require('path')
const socketio = require('socket.io')
const PlatziverseAgent = require('platziverse-agent')
const proxy = require('./proxy')
const asyncify = require('express-asyncify')

const port = process.env.PORT || 8080
const app = asyncify(express())
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverseAgent()

app.use(express.static(path.join(__dirname, 'public')))

app.use('/', proxy)

// Express Errro Handler
app.use((err, req, res, next) => {
  debug(`Errro: ${err.message}`)
  if (err.message.match(/not found/)) {
    return res.status(404).send({error: err.message})
  }

  if (err.message.match(/not authorized/) || err.message.match(/authorization token/)) {
    return res.status(401).send({error: err.message})
  }

  if (err.message.match(/Permission denied/)) {
    return res.status(403).send({error: err.message})
  }

  res.status(500).send({error: err.message})
})

// SOcketIO
io.on('connection', socket => {
  debug(`Connected ${socket.id}`)

  agent.on('agent/message', payload => {
    socket.emit('agent/message', payload)
  })

  agent.on('agent/connected', payload => {
    socket.emit('agent/connected', payload)
  })

  agent.on('agent/disconnected', payload => {
    socket.emit('agent/disconnected', payload)
  })
})

process.on('uncaughtException', handlerFatalError)
process.on('unhandledRejection', handlerFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-web]')} server listening on port ${port}`)
  agent.connect()
})

function handlerFatalError (err) {
  console.error(`${chalk.red('[fatal Error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
