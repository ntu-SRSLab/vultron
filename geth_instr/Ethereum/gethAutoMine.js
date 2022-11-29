//gethrun script .
//function : 1、detect whether there exists one transaction has been submitted 
//           2、auto mine to enable the transaction in BlockChain
var primary = eth.accounts[0];
personal.unlockAccount(primary,"123456",200*60*60);
personal.unlockAccount(eth.accounts[1],"123456",200*60*60)
miner.setEtherbase(primary);
while(true){
   var status = txpool.status;

   if(status.pending!=0||status.queued!=0){
				miner.start(1);
				admin.sleepBlocks(1);
                                miner.stop();
   }
}
