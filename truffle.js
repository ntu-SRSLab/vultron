/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a 
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() { 
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>') 
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    /// 172.21.176.77
    //172.18.0.1
    networks: {
	development: {
	    host: "127.0.0.1",
	    port: 8546,
	    network_id: "*"
	},
	fuzz: {
	    host: "172.18.0.1",
	    port: 8545,
	    network_id: "1900",
            from:"0x2B71cc952C8e3dFe97A696CF5C5b29F8a07dE3D8"
	},
	SCFuzzer: {
            host: "127.0.0.1",
	    port: 8546,
	    network_id: "*",
	}
 	
    },
compilers: {
    solc: {
      version: "native" // A version or constraint - Ex. "^0.5.0"
                         // Can also be set to "native" to use a native solc
      }
  }
};

