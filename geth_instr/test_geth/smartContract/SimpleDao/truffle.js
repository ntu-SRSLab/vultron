module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    SCFuzzer: {
    	host: "127.0.0.1",
    	port: 7545,
    	network_id: "*",
      gas: 2000000, 
      from: "0x10c24625b7d8e6499fe8e15c0bc750cfae72ea29"
	  }
  }
};
