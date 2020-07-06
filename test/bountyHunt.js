
var BountyHunt = artifacts.require("BountyHunt");

contract('BountyHunt', function(accounts) {
  console.log(accounts);
  it("Test BountyHunt mannually", function() {
    var att;    
    BountyHunt.deployed().then(function(instance) {
      console.log(instance);
      att = instance;
      web3.eth.getBalance(att.address).then(function(balance) {
          console.log(balance);
          return arr.grantBounty("0x01A7441f557499c89A11D679CF290A880948D95C","0xe2f3706baa7f8f795c17063e4f70ea010b71dcd610fa21df2000000000000000", {from: accounts[0]})
      }).then(() => arr.bountyAmount.call("0x01A7441f557499c89A11D679CF290A880948D95C"))
      .then(balance => {
        let booking = balance.toNumber();
        console.log(booking);
      });
    })
  });
    
});
