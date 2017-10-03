'use strict'
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const test = require('ava')
const agentFixtures = require('./fixtures/agent')


let db = null
let sandbox = null
let AgentStub = null
let single = Object.assign({}, agentFixtures.single)
let id = 1

let config = {
  logging: function () {}
}
let MetricStub = {
  belongsTo: sinon.spy()
}

test.beforeEach(async () => {
  sandbox= sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }
  // Model findById Stub
  AgentStub.findById = sandbox.stub()
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})
test.afterEach( () =>{
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent Services should exist')
})

test.serial('setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})