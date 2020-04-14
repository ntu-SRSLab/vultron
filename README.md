# Vultron: the Ultimate Smart Contract Fuzzing Framework


### Running Vultron (ContraMaster)

#### Dependencies

* Node.js: 12.12.0
* Truffle: 5.0.42
* Go-Ethereum: 1.8+ (a customized version is required to enable the fuzzing feedback)
```
git submodule foreach "(git checkout master; git pull)&"                                           ```

#### Getting Started

```bash
npm install;                # Install dependencies
./utils/startTruffle.sh;    # Deploy contracts to your private blockchain (this assumes a running private Ethereum blockchain)

node server.js              # Note: if encountering password error, go to connection/fuzzer.js and replace '123456' with your account password in the function 'unlockAccount')
```
#### Usage Steps

1. Deploy target and attack contracts to the test network.
1. Load contract source (.sol) and compiled (.json) code via the user interface.
1. Run seed tests (without feedback) and observe the results.

Vultron (ContraMaster) can also be run under the batch mode, with appropriate commandline options.

#### Benchmark

The benchmark used in the **ContraMaster** experiments is available under ```./benchmark```.
Both the contract source code and the migration (deployment) scripts are provided. The discovered exploits can be found in the file ```exploit_<N>.txt```.


### FISCO-BCOS Vultron

#### Dependencies

* FISCO-BCOS
* Node.js: 12.12.0

#### Configurations

1. Update BCOS configuration file at `./connection/fisco/config.json` 
(replace the paths to 'key', 'cert', 'ca' according to your own setup):

```json
{
    "privateKey": {
        "type": "pem",
        "value": "./0x144d5ca47de35194b019b6f11a56028b964585c9.pem"
    },
    "nodes": [
        {
            "ip": "127.0.0.1",
            "port": "20200"
        }
    ],
    "authentication": {
        "key": "/home/XXX/Webank/fisco/nodes/127.0.0.1/sdk/sdk.key",
        "cert":"/home/XXX/Webank/fisco/nodes/127.0.0.1/sdk/sdk.crt",
        "ca":  "/home/XXX/Webank/fisco/nodes/cert/ca.crt"
    },
    "groupID": 1,
    "timeout": 10000
}
```

2. Install packages

```
   npm install
```

3. Prerequisites: Install solc and Pull Vultron-Fisco git repo 
```
  ./prerequisites.sh 
```
4. Compile wecredit contracts
```
   node compile.js
```

#### Getting Started

1. Start the server:
```
  node server.js
```
2. Test BCOS connection:
```
  http://localhost:3000/fisco 
```
3. Test BCOS deploy:
```
  http://localhost:3000/fisco/deploy 
```
3. Deploy wecredit contract
```
  http://localhost:3000/fisco/deploy/wecredit 
```
4. Load wecredit contract
```
  http://localhost:3000/fisco/load/wecredit 
```
5. Bootstrap wecredit contract
```
  http://localhost:3000/fisco/bootstrap/wecredit 
```
