'use strict'
const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const chalk = require('chalk')
const redis = require('redis')

const backend = {
  type: 'redis',
  redis,
  return_buffers:true
}

const settings= {
  port:1883,
  backend
}

const server = new mosca.Server(settings)

server.on('ready', () => {
  console.log(`${chalk.green('[platziverse-mqtt]')} Server is running`)
})