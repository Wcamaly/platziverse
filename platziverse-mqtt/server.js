'use strict'
const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const chalk = require('chalk')
const redis = require('redis')
const db = require('platziverse-db')
const dbC = require('platziverse-config')()

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

let config = dbC.dbConfig({setup: false})

const settings = {
  port: 1883,
  backend
}

let Agent, Metric

const server = new mosca.Server(settings)
server.on('clientConnected', client => {
  debug(`Client Connected: ${client.id}`)
})
server.on('clientDisconnected', client => {
  debug(`Client Disconnected ${client.id}`)
})

server.on('published', (packet, client) => {
  debug(`Received: ${packet.topic}`)
  debug(`Payload: ${packet.payload}`)
})

server.on('ready', async () => {
  console.log(config)
  const services = await db(config).catch(handlerFatalError)
  console.log('connected!!')
  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[platziverse-mqtt]')} Server is running`)
})

server.on('error', handlerFatalError)

function handlerFatalError (err) {
  console.log('acaaa°°')
  console.log(`${chalk.red('[fatal error]')} ${err.message}`)
  console.log(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handlerFatalError)
process.on('unhandledRejection', handlerFatalError)
