'use strict'
const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const chalk = require('chalk')
const redis = require('redis')
const db = require('platziverse-db')
const dbC = require('platziverse-config')
const { parsePayload } = require('./utils')

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
const clients = new Map()

server.on('clientConnected', client => {
  debug(`Client Connected: ${client.id}`)
  clients.set(client.id, null)
})
server.on('clientDisconnected', async client => {
  debug(`Client Disconnected ${client.id}`)
  const agent = clients.get(client.id)

  if (agent) {
    // Mark Agent as Disconnected
    agent.connected = false
    try {
      await Agent.createOrUpdate(agent)
    } catch (e) {
      return handlerError(e)
    }
    // Delete Agent form Clients List
    clients.delete(client.id)

    server.publich({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })

    debug(`Client ${client.id} associad to Agent ${agent.uuid} marked as disconnected`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Received: ${packet.topic}`)

  switch (packet.topic) {
    case 'agente/connected':
    case 'agente/disconnected':
      debug(`Payload: ${packet.payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${packet.payload}`)
      
      const payload = parsePayload(packet.payload)

      if (payload) {
        payload.agent.connected = true

        let agent
        try {
          console.log('PAYLOAD', JSON.stringify(payload.agent))
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (e) {
          console.log(`${chalk.red('[Error]')} Agent`)
          return handlerError(e)
        }

        debug(`Agent ${agent.uuid} saved`)

          // Notify Agent is connected
        if (!clients.get(client.id)) {
          clients.set(client.id)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid,
                connected: agent.connected
              }
            })
          })
        }

        // Stroe Metrics
        
        /*for (let i=0; i < payload.metrics.length ; i++ ) {
          Metric.create(agent.uuid,payload.metrics[i] ).then(function (res) {
            debug(`Metric ${res.id} saved on agent ${agent.uuid}`)
          }).catch(function(e) {
            return handlerError(e)
          })
        }

        */
         //code tutorial
        for (let metric of payload.metrics) {
          let m
          try {
            m = await Metric.create(agent.uuid, metric)
          } catch (e) {
            console.log(`${chalk.red('[Error]')} Metric`)
            return handlerError(e)
          }
          debug(`Metric ${m.id} saved on agent ${agent.uuid}`)
        }
      }
      break
  }
})

server.on('ready', async () => {
  const services = await db(config).catch(handlerFatalError)
  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[platziverse-mqtt]')} Server is running`)
})

server.on('error', handlerFatalError)

function handlerFatalError (err) {
  console.log(`${chalk.red('[fatal error]')} ${err.message}`)
  console.log(err.stack)
  process.exit(1)
}

function handlerError (err) {
  console.log(`${chalk.red('[Error]')} ${err.message}`)
  console.log(err.stack)
}

process.on('uncaughtException', handlerFatalError)
process.on('unhandledRejection', handlerFatalError)
