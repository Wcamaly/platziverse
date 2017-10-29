'use strict'

module.exports = function configProxy () {
  return {
    endpoint : process.env.API_ENDPOINT || 'http://localhost:3000',
    apiToken : process.env.API_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.e2FkbWluOiB0cnVlLCB1c2VybmFtZTogJ3BsYXR6aScsIHBlcm1pc3Npb25zOiBbJ21ldHJpY3M6cmVhZCddfQ.KtK9WG8JX5gAeedK4dUvCmwsrxIjAmXbHpgzlAPPFSE'
  }
}

