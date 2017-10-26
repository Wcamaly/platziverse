'use stric'
const db = require('platziverse-db')
const moduleConfig = require('platziverse-config')
const asyncify = require('express-asyncify')
const debug = require('debug')('platziverse:api:router')
const auth = require('express-jwt')

const express = require('express')

const api = asyncify(express.Router())
let config = moduleConfig.dbConfig({setup: false})
let secret = moduleConfig.authConfig()

let services, Agent, Metric

api.use('*', async (req, res, next) => {
  if (!services) {
    try {
      services = await db(config)
      debug('Connected to Database')
    } catch (err) {
      return next(err)
    }
    Agent = services.Agent
    Metric = services.Metric
  }
  next()
})

api.get('/agents', auth(secret.auth) ,async (req, res, next) => {
  let agents = []
  const { user } = req

  if(!user && !user.username) {
    return next(new Error('not authorized'))
  }


  try {
    if (user.admin) {
      agents = await Agent.findConnected()
    }else {
      agents = await Agent.findByUsername(user.username)
    }

  } catch (e) {
    return next(e)
  }
  res.send(agents)
})

api.get('/agent/:uuid', async (req, res, next) => {
  const { uuid } = req.params
  debug(`request to /agent/${uuid}`)
  let agent
  try {
    agent = await Agent.findByUuid(uuid)
  } catch (e) {
    return next(e)
  }
  if (!agent) {
    return next(new Error(`Agent not found with uuid ${uuid}`))
  }

  res.send(agent)
})

api.get('/metrics/:uuid', async (req, res, next) => {
  const { uuid } = req.params
  debug(`request /metric/${uuid}`)
  let metrics = []
  try {
    metrics = await Metric.findByAgentUuid(uuid)
  } catch (e) {
    return next(e)
  }
  if (!metrics || metrics.length === 0) {
    return next(new Error(`Metrics not found for agent with uuid ${uuid}`))
  }
  res.send(metrics)
})

api.get('/metrics/:uuid/:type', async (req, res, next) => {
  const { uuid, type } = req.params
  debug(`request /metrics/${uuid}/${type}`)
  let metrics = []
  try {
    metrics = await Metric.findByTypeAgentUuid(type, uuid)
  } catch (e) {
    return next(e)
  }

  if (!metrics || metrics.length === 0) {
    return next(new Error(`Metrics (${type}) not found for agent with uuid ${uuid}`))
  }
  res.send(metrics)
})

module.exports = api
