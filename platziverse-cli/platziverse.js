#!/usr/bin/env node

'use strict'
/* eslint new-cap: "off" */

const blessed = require('blessed')
const contrib = require('blessed-contrib')
const PlatziverseAgent = require('platziverse-agent')
const moment = require('moment')



const agent = new PlatziverseAgent()
const agents = new Map()
const agentsMetrics = new Map()
let extended= []
let selected = {
  uuid: null,
  type: null
}


const screen = blessed.screen()
const grid = new contrib.grid({
  rows: 1,
  cols: 4,
  screen
})

const tree = grid.set(0, 0, 1, 1, contrib.tree, {
  label: 'Connected Agents'
})

const line = grid.set(0, 1, 1, 3, contrib.line, {
  label: 'Metric',
  showLagend: true,
  minY: 0,
  xPadding: 5
})

agent.on('agent/connected', payload => {
  const { uuid } = payload.agent
  
  if (!agents.has(uuid)){
    agents.set(uuid, payload.agent)
    agentsMetrics.set(uuid, {})
  }

  renderData()
})

agent.on('agent/disconnected', payload => {
  const { uuid } = payload.agent
  
  if (agents.has(uuid)){
    agents.delete(uuid)
    agentsMetrics.delete(uuid)
  }

  renderData()
})

agent.on('agent/message', payload => {
  const { uuid } = payload.agent
  const { timestamp } = payload
  
  if (!agents.has(uuid)){
    agents.set(uuid, payload.agent)
    agentsMetrics.set(uuid, {})
  }
  const metrics = agentsMetrics.get(uuid)

  payload.metrics.forEach(m => {
    const { type, value } = m
    if (!Array.isArray(metrics[type])) {
      metrics[type] = []
    }

    const length = metrics[type].length
    if (length >= 20){
      metrics[type].shift()
    }
    metrics[type].push({
      value,
      timestamp : moment(timestamp).format('HH:mm:ss')
    })
  })

  renderData()
  renderMetric()
})

tree.on('select', node => {
  const { uuid, type } = node
  if (node.agent) {
    node.extended ? extended.push(uuid) : extended = extended.filter(e => e !== uuid)
    selected.uuid= null
    selected.type = null
    return
  }
  selected.uuid = uuid
  selected.type = node.type

  renderMetric()
})

function renderData() {
  const treeData = {}
  let idx = 0
  for (let [uuid, val] of agents) {
    const title = `${val.name} - (${ val.pid})`
    treeData[title] = {
      uuid,
      agent: true,
      extended : extended.includes(uuid),
      children: {}
    }
    const metrics = agentsMetrics.get(uuid)

    Object.keys(metrics).forEach(type => {
      const metric = {
        uuid, 
        type,
        metric : true
      }
      const metricName = ` ${type} ${" ".repeat(1000)} ${idx}`
      idx++
      treeData[title].children[metricName] = metric
    })

  }

  tree.setData({
    extended: true,
    children: treeData
  })
  screen.render()
}

function renderMetric () {
  if (!selected.uuid && !selected.type) {
    line.setData([{x:[], y: [], title: ''}])
    screen.render()
    return
  }

  const metrics = agentsMetrics.get(selected.uuid)
  const value = metrics[selected.type]

  const serie = [{
    title: selected.type,
    x: value.map(v => v.timestamp).slice(-10),
    y: value.map(v => v.value).slice(-10),
  }]

  line.setData(serie)
  screen.render()

}

screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  process.exit()
})

agent.connect()
tree.focus()
screen.render()
