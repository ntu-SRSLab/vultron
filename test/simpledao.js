var SimpleDAO = artifacts.require("SimpleDAO");

contract('SimpleDAO', function(accounts) {
  it("should send 1 eth", function() {
    var dao;

    var account_one = accounts[0];
    var account_two = accounts[1];
    
    return SimpleDAO.deployed().then(function(instance) {
      dao = instance;
      return dao.donate(account_one, {from: account_one, value: 10});
    }).then(function() {
      return dao.queryCredit.call(account_one);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10);
    }).then(function() {
      return dao.withdraw.call(2);
    }).then(function() {
      return dao.queryCredit.call(account_one);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 8);
    });
  });
});
