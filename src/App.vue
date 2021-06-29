<template>
  <div>
    <div>Wallet : {{ wallet.address }}</div>
    <br />
    <div>Gas : {{ wallet.gas }}</div>
    <br />
    <div>
      Token
      <div v-for="(token, index) in wallet.tokens" :key="index">
        {{ token }}
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from "web3";
const Token = require("./contract/Token.json");
const Exchange = require("./contract/Exchange.json");
const ABI = require("./contract/ABI.json");

const GAS_DECIMALS = 1000000000000000000; //Zero 18 digits
const __web3__ = new Web3(window.ethereum);
const __cahed__ = {};

const debounce = (callback, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback.apply(this, args), timeout);
  };
};

const getContract = (abi, address) => {
  let contract = __cahed__[address];
  if (!contract) {
    contract = new __web3__.eth.Contract(abi, address);
    __cahed__[address] = contract;
  }
  return contract;
};

const getPair = (factory, tokenA, tokenB) => {
  return getContract(ABI.Factory, factory)
    .methods.getPair(tokenA, tokenB)
    .call();
};

const getPrice = (exchange, tokenA, tokenB) => {
  return getPair(exchange, tokenA, tokenB).then((pair) => {
    return getContract(ABI.Pairs, pair)
      .methods.getReserves()
      .call()
      .then((reserves) => reserves[1] / reserves[0]);
  });
};

const getTokenInfo = (config) => {
  const contract = getContract(ABI.ERC20, config.token);
  const methods = contract.methods;
  const name = methods.name().call();
  const symbol = methods.symbol().call();
  const balanceOf = methods.balanceOf(config.wallet).call();
  const decimals = methods.decimals().call();
  const price = getPrice(config.exchange, config.token, config.tokenPair);
  return Promise.all([name, symbol, balanceOf, decimals, price]).then(
    (values) => {
      const balance = values[2] / Math.pow(10, values[3]);
      return {
        name: values[0],
        symbol: values[1],
        address: config.token,
        balance: balance,
        price: values[4],
        value: balance * values[4],
      };
    }
  );
};

export default {
  data() {
    return {
      wallet: {
        address: null,
        gas: null,
        tokens: [],
      },
    };
  },
  mounted() {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask");
      return;
    }

    const saveAddress = (accounts) => (this.wallet.address = accounts[0]);

    window.ethereum
      .on("accountsChanged", saveAddress)
      .request({ method: "eth_requestAccounts" })
      .then(saveAddress)
      .then(this.walletDetails);

    __web3__.eth.subscribe("newBlockHeaders", debounce(this.walletDetails));
  },
  methods: {
    walletDetails() {
      __web3__.eth
        .getBalance(this.wallet.address)
        .then((balance) => (this.wallet.gas = balance / GAS_DECIMALS));

      Promise.all(
        Object.keys(Token)
          .filter((key) => key !== "Stablecoin")
          .map((key) =>
            getTokenInfo({
              wallet: this.wallet.address,
              token: Token[key],
              tokenPair: Token.Stablecoin.BUSD,
              exchange: Exchange.Twindex.Factory,
            })
          )
      ).then((tokens) => (this.wallet.tokens = tokens));
    },
  },
};
</script>
