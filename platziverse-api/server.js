'use stric'

const http = require('http')
const express = require('express')
const chalk = require('chalk')
const routes = require('./api')
const debug = require('debug')
const asyncify = require('express-asyncify')

const port = process.env.PORT || 3000
const app = asyncify(express())

app.use('/api', routes)

// Express Errro Handler
app.use((err, req, res, next) => {
  debug(`Errro: ${err.message}`)
  if (err.message.match(/not found/)) {
    return res.status(404).send({error: err.message})
  }

  res.status(500).send({error: err.message})
})

function handlerFatalError (err) {
  console.error(`${chalk.red('[fatal Error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}
const server = http.createServer(app)

if (!module.parent) {
  process.on('uncaughtException', handlerFatalError)
  process.on('unhandledRejection', handlerFatalError)

  server.listen(port, () => {
    console.log(`${chalk.green('[platziverse-api]')} server listening on port ${port}`)
  })
}

module.exports = server
