'use stric'
const test = require('ava')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')
const auth = require('../auth')
const util = require('util')
const config = require('platziverse-config').authConfig()

const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = {}
let AgentStub = {}
let MetricStub = {}
let uuid = 'yyy-yyy-yyy'
let type = 'web'
let token, tokenfail

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))

  AgentStub.findConnected = sandbox.stub()
  AgentStub.findConnected.returns(Promise.resolve(agentFixtures.connected))
  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(uuid).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(uuid).returns(Promise.resolve(metricFixtures.findUuid(uuid)))
  MetricStub.findByTypeAgentUuid = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(type, uuid).returns(Promise.resolve(metricFixtures.findTypeAgentUuid(type, uuid)))

  token = await sign({ 'permissions': ['metrics:read'], 'username': 'myApp', 'admin': true }, config.auth.secret)
  tokenfail = await sign({}, config.auth.secret)
  const api = proxyquire('../api', {
    'platziverse-db': dbStub
  })
  server = proxyquire('../server', {
    './api': api
  })
})
test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test.serial.cb('/api/agents', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.connected)
      t.deepEqual(body, expected, 'response body shhould be the expected')
      t.end()
    })
})

test.serial.cb('/api/agents | has not token', t => {
  request(server)
    .get('/api/agents')
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      console.log(err)
      t.falsy(err, 'should not return an error')
      t.true(/authorization token/.test(res.body.error), 'Should be a error')
      t.end()
    })
})
test.serial.cb('/api/agents | has not username', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${tokenfail}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not authorized/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid', t => {
  request(server)
    .get(`/api/agent/${uuid}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.byUuid(uuid))
      t.deepEqual(body, expected, 'response body shhould be the expected')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid not exist', t => {
  request(server)
    .get(`/api/agent/ssss`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not found/.test(res.body.error), 'shpuld be a error')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid  | has not token', t => {
  request(server)
    .get(`/api/agent/${uuid}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      console.log(err)
      t.falsy(err, 'should not return an error')
      t.true(/authorization token/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid | has not username', t => {
  request(server)
    .get(`/api/agent/${uuid}`)
    .set('Authorization', `Bearer ${tokenfail}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not authorized/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid', t => {
  request(server)
    .get(`/api/metrics/${uuid}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findUuid(uuid))
      t.deepEqual(body, expected, 'response body shhould be the expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid | not exist', t => {
  request(server)
    .get(`/api/metrics/sss`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not found/.test(res.body.error), 'shpuld be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid | has not token', t => {
  request(server)
    .get(`/api/metrics/${uuid}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      console.log(err)
      t.falsy(err, 'should not return an error')
      t.true(/authorization token/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid | has not username', t => {
  request(server)
    .get(`/api/metrics/${uuid}`)
    .set('Authorization', `Bearer ${tokenfail}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not authorized/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type', t => {
  request(server)
    .get(`/api/metrics/${uuid}/${type}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findTypeAgentUuid(type, uuid))
      t.deepEqual(body, expected, 'response body shhould be the expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type not exist', t => {
  request(server)
    .get(`/api/metrics/ssss/sss`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not found/.test(res.body.error), 'shpuld be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type | has not token', t => {
  request(server)
    .get(`/api/metrics/${uuid}/${type}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      console.log(err)
      t.falsy(err, 'should not return an error')
      t.true(/authorization token/.test(res.body.error), 'Should be a error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type | has not username', t => {
  request(server)
    .get(`/api/metrics/${uuid}/${type}`)
    .set('Authorization', `Bearer ${tokenfail}`)
    .expect(401)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      t.true(/not authorized/.test(res.body.error), 'Should be a error')
      t.end()
    })
})
