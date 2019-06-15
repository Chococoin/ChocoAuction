const ChocoAuction = artifacts.require("ChocoAuction");

module.exports = function(deployer) {
  deployer.deploy(ChocoAuction);
};