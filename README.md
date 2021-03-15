# Vultron: the Ultimate Smart Contract Fuzzing Framework
This is non-gui version for vultron experiment.

### Running Vultron (ContraMaster)

#### Dependencies
* Python3
* Python2.7
* Node.js: 12.12.0
* Truffle: 5.0.42

### Requirement
```bash
###The solidity static analyzer, Slither requires Python 3.6+ and solc, the Solidity compiler.
pip3 install slither-analyzer
### recommended solc 0.4.25 for the benchmark cases
wget https://github.com/ethereum/solidity/releases/download/v0.4.25/solc-static-linux -O /usr/bin/solc && chmod +x /usr/bin/solc
```

### Test Connection between Vultron and Ethereum Client (Aleth)
```bash
### Terminal window@1
git clone git@github.com:ntu-SRSLab/vultron.git
cd vultron
git switch ContraMaster-liuye
npm install;                # Install dependencies

### Terminal window@2
cd ./vultron/AlethWithTraceRecorder
git submodule init
git submodule update
./bootstrap-scripts/aleth-ethereum/runAleth.sh # Start Ethereum Client (Aleth)

### Terminal window@3
cd vultron
./utils/startTruffle.sh;    # Deploy contracts to your private blockchain (this assumes a running private Ethereum blockchain)
# Note: Here the contract deployment will hang there at your first use, you may need to go back to Terminal Window@2 for enter account password. It is "123456".)
```
If everything goes well, we could use the non-gui vultron to generate test case for finding bugs.

### Getting Started (Take Bounty for an example)

```bash
cd  vultron                
node silent-server.js  BountyHunt  Attack_BountyHunt0
```
Here you will see a lot of transaction feedbacks on terminal screen.

### Benchmark

The benchmark used in the **ContraMaster** experiments is available under ```./benchmark```.
Both the contract source code and the migration (deployment) scripts are provided. 