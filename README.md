# Vultron: the Ultimate Smart Contract Fuzzing Framework


Quick instructions to run ContraMaster:

```bash
npm install;                # Install dependencies
./utils/startTruffle.sh;    # Deploy contracts to your private blockchain (this assumes a running private Ethereum blockchain)

node server.js              # Note: if encountering password error, go to connection/fuzzer.js and replace '123456' with your account password in the function 'unlockAccount')
```

The benchmark used in the ContraMaster experiments is available under ```./benchmark```.
