<template>
   <div class="container">
    <p v-if="isConnected">We're connected to the server!</p>
    <p>Message from server: "{{socketMessage}}"</p>
    <button @click="pingServer()">Ping Server</button>
  </div>
</template>

<script>
export default {
  name: "Test",
  data() {
    return {
      isConnected: false,
      socketMessage: ''
    }
  },
  methods: {
    pingServer() {
      // Send the "pingServer" event to the server.
      this.$socket.emit('pingServer', 'PING!');
      console.log(this.$socket);
    }
  }
}
</script>