'use strict'
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const test = require('ava')
const metricFixtures = require('./fixtures/metric')
const agentFixtures = require('./fixtures/agent')

let uuid = 'yyy-yyy-yyy'
let MetricStub = null
let sandbox = null
let db = null
let type = 'app'
let AgentStub = {
  hasMany: sinon.spy()
}
let newMetric = {
  type: 'CPU',
  value: '23%'
}
let config = {
  logging: function () {}
}
let uuidArgs = {
  where: {
    uuid
  }
}
let metricUuiArgs = {
  attributes: ['type'],
  gourp: ['type'],
  include: [{
    model: AgentStub,
    attributes: [],
    where: {
      uuid
    }
  }],
  raw: true
}
let typeUuidArgs = {
  attributes: ['id', 'type', 'value', 'createdAt'],
  where: {
    type
  },
  limit: 20,
  order: [['createdAt', 'DESC']],
  include: {
    model: AgentStub,
    attributes: [],
    where: {
      uuid
    }
  },
  raw: true
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  MetricStub = {
    belongsTo: sandbox.spy()
  }

  // Metric create Stub
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(uuid, newMetric).returns(Promise.resolve(newMetric))
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON () { return newMetric }
  }))

  // Metric findByAgentUuid Stub
  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(uuid).returns(Promise.resolve(metricFixtures.findUuid(uuid)))

  // Metric findByTypeAgentUuid Stub
  MetricStub.findByTypeAgentUuid = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(type, uuid).returns(Promise.resolve(metricFixtures.findTypeAgentUuid(type, uuid)))

  // Metric findAll Stub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(metricUuiArgs).returns(Promise.resolve(metricFixtures.findUuid(uuid)))
  MetricStub.findAll.withArgs(typeUuidArgs).returns(Promise.resolve(metricFixtures.findTypeAgentUuid(type, uuid)))
  // Agent findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.single))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})
test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('metric', t => {
  t.truthy(db.Metric, 'metric Services should exist')
})

test.serial('setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(uuid, newMetric)

  t.true(MetricStub.create.called, 'create should be called at model')
  t.true(MetricStub.create.calledOnce, 'create Should be called Once')
  t.true(MetricStub.create.calledWith(newMetric), 'create should be called arguments')

  t.deepEqual(metric, newMetric, 'metric should be the same')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metrics = await db.Metric.findByAgentUuid(uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called Once')
  t.true(MetricStub.findAll.calledWith(metricUuiArgs), 'findAll should be with args')

  t.is(metrics.length, metricFixtures.findUuid(uuid).length, 'should be the amount')
  t.deepEqual(metrics, metricFixtures.findUuid(uuid), 'metrics should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metrics = await db.Metric.findByTypeAgentUuid(type, uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called Once')
  t.true(MetricStub.findAll.calledWith(typeUuidArgs), 'findAll should be with args')

  t.is(metrics.length, metricFixtures.findTypeAgentUuid(type, uuid).length, 'should be with amount')

  t.deepEqual(metrics, metricFixtures.findTypeAgentUuid(type, uuid), 'metrics should be the same')
})
