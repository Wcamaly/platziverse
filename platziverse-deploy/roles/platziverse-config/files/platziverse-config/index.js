'use strict'

const dbConfig = require('./lib/config-db.js')
const authConfig = require('./lib/config-auth.js')
const proxyConfig = require('./lib/config-web.js')

module.exports =  {
  dbConfig,
  authConfig,
  proxyConfig
}
