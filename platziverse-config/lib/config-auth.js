'use strict'

module.exports = function configAuth () {
  return {
    auth: {
      secret: process.env.SECRET || 'platzi'
    }
  }
}

