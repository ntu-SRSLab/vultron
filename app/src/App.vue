<template>
  <div id="app">
    <!-- <div class="container">
    <p v-if="isConnected">We're connected to the server!</p>
    <p>Message from server: "{{socketMessage}}"</p>
    <button @click="pingServer()">Ping Server</button>
  </div> -->
    <NavHeader  ></NavHeader>
    <Tab> </Tab>
    <BotFooter> </BotFooter>
  </div>
</template>

<script>

// console.log(this.$socket);
import BotFooter from "./components/BotFooter";
import NavHeader from "./components/NavHeader";
import Tab from "./components/Tab";
export default {
  name: "App",
  components: {
    BotFooter,
    NavHeader,
    Tab
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
