'use strict'
const db = require('../')

async function run () {
  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  }

  const {Agent, Metric} = await db(config).catch(handlerFatalError)
  const agent = await Agent.createOrUpdate({
    uuid: 'xxx',
    name: 'test',
    username: 'test',
    hostname: 'test',
    pid: 1,
    connected: true
  }).catch(handlerFatalError)

  console.log('-- Agent --')
  console.log(agent)

  const agents = await Agent.findAll().catch(handlerFatalError)

  console.log('-- findAll --')
  console.log(agents)
  const metric = await Metric.create(agent.uuid, {
    type: 'memory',
    value: '300'
  })
  console.log('-- Metric --')
  console.log(metric)

  const metrics = await Metric.findByAgentUuid(agent.uuid).catch(handlerFatalError)
  console.log('-- Metrics uuid --')
  console.log(metrics)

  const typeAgentUuid = await Metric.findByTypeAgentUuid('memory', agent.uuid).catch(handlerFatalError)
  console.log('-- Metrics findByTypeAgentUuid --')
  console.log(typeAgentUuid)
}
function handlerFatalError (err) {
  console.error(err.message)
  console.error(err.stack)
  process.exit(1)
}

run()
