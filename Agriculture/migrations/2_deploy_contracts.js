var TaskSystem = artifacts.require('./TaskSystem.sol')

module.exports = function (deployer) {
  deployer.deploy(TaskSystem)
}
