const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('exploit.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`conent：${line}`);
});