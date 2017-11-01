'use strict'
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const test = require('ava')
const agentFixtures = require('./fixtures/agent')

let db = null
let sandbox = null
let AgentStub = null
let single = Object.assign({}, agentFixtures.single)
let uuid = 'yyy-yyy-yyy'
let id = 1
let username = 'platzi'
let uuidArgs = {
  where: {
    uuid
  }
}
let config = {
  logging: function () {}
}
let MetricStub = {
  belongsTo: sinon.spy()
}
let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}
let usernameArgs = {
  where: { username: 'platzi', connected: true }
}
let connectedArgs = {
  where: { connected: true }
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }
  // Model findOne stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model Update stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model findById Stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model create Stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

  // Model findByUuid Stub
  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(uuid).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model findAll Stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))

  // Model findByUsername Stub
  AgentStub.findByUsername = sandbox.stub()
  AgentStub.findByUsername.withArgs(username).returns(Promise.resolve(agentFixtures.platzi))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})
test.afterEach(() => {
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
  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with id')

  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})

test.serial('Agent#createOrUpdate -  exist', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne shouldbe called on Model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.update.calledOnce, 'update shouldbe called once')

  t.deepEqual(agent, single, 'agent should be the same')
})

test.serial('Agent#createOrUpdate -  new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.called, 'findOne shouldbe called on Model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith({
    where: {uuid: newAgent.uuid}
  }), 'findOne should be with uuid args')

  t.true(AgentStub.create.called, 'update shouldbe called on Model')
  t.true(AgentStub.create.calledOnce, 'update shouldbe called once')
  t.true(AgentStub.create.calledWith(newAgent), 'update should be with newAgent')

  t.deepEqual(agent, newAgent, 'agent should be the same')
})

test.serial('Agent#findByUuid', async t => {
  let agent = await db.Agent.findByUuid(uuid)

  t.true(AgentStub.findOne.called, 'findOne shouldbe called on Model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be with uuid args')

  t.deepEqual(agent, single, 'Should be the same')
})

test.serial('Agent#findAll', async t => {
  let agents = await db.Agent.findAll()

  t.true(AgentStub.findAll.called, 'findAll shouldbe called on Model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called twice')
  t.true(AgentStub.findAll.calledWith(), 'findAll should be with uuid args')

  t.is(agents.length, agentFixtures.all.length, 'agents should be the same amount')
  t.deepEqual(agents, agentFixtures.all, 'agents should be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agents = await db.Agent.findByUsername(username)

  t.true(AgentStub.findAll.called, 'findAll shouldbe called on Model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called twice')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'findAll should be with uuid usernameArgs')

  t.is(agents.length, agentFixtures.platzi.length, 'agents should be the same amount')
  t.deepEqual(agents, agentFixtures.platzi, 'agents should be the same')
})

test.serial('Agent#findConnected', async t => {
  let agents = await db.Agent.findConnected()

  t.true(AgentStub.findAll.called, 'findAll shouldbe called on Model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called Once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'findAll should be with uuid args')

  t.is(agents.length, agentFixtures.connected.length, 'agents should be the same amount')
  t.deepEqual(agents, agentFixtures.connected, 'agents, should be the same')
})
