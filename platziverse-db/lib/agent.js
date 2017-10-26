'use strict'

module.exports = function setupAgent (AgentModel) {
  function findById (id) {
    return AgentModel.findById(id)
  }

  async function createOrUpdate (agent) {
    const cond = {
      where: {
        uuid: agent.uuid
      }
    }
    const existingAgent = await AgentModel.findOne(cond)
    console.log(`Exist ${agent.uuid} ${existingAgent}`)
    if (existingAgent) {
      const update = await AgentModel.update(agent, cond)
      console.log(`UPDATE ${agent.uuid} ${update}`)

      return update ? AgentModel.findOne(cond) : existingAgent
    }
    const result = await AgentModel.create(agent)
    console.log(`UPDATE ${agent.uuid} ${result.toJSON()}`)
    return result.toJSON()
  }

  function findByUuid (uuid) {
    return AgentModel.findOne({
      where: {
        uuid
      }
    })
  }

  function findAll () {
    return AgentModel.findAll()
  }

  function findByUsername (username) {
    return AgentModel.findAll({
      where: {
        username,
        connected: true
      }
    })
  }

  function findConnected () {
    return AgentModel.findAll({
      where: {
        connected: true
      }
    })
  }

  return {
    findById,
    createOrUpdate,
    findByUuid,
    findAll,
    findByUsername,
    findConnected
  }
}
