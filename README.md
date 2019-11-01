# Vultron: the Ultimate Smart Contract Fuzzing Framework


### Running Vultron (ContraMaster)

#### Dependencies

* Node.js: 12.12.0
* Truffle: 5.0.42
* Go-Ethereum: 1.8+ (a customized version is required to enable the fuzzing feedback)

#### Getting Started

```bash
npm install;                # Install dependencies
./utils/startTruffle.sh;    # Deploy contracts to your private blockchain (this assumes a running private Ethereum blockchain)

node server.js              # Note: if encountering password error, go to connection/fuzzer.js and replace '123456' with your account password in the function 'unlockAccount')
```

### Benchmark

The benchmark used in the **ContraMaster** experiments is available under ```./benchmark```.
Both the contract source code and the migration (deployment) scripts are provided. The discovered exploits can be found in the file ```exploit_<N>.txt```.
