import Vue from "vue";
import App from "./App.vue";
import Smcat from "state-machine-cat"
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Popper from 'popper.js'

import SocketIO from "socket.io-client"


Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false
global.Popper = Popper;
global.vm = vm; //Define you app variable globally
const SocketInstance = SocketIO('http://localhost:3000');

Vue.prototype.$socket = SocketInstance;
Vue.prototype.$smcat = Smcat;
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);
Vue.config.productionTip = false;

var vm =new Vue({   
  render: h => h(App)
}).$mount("#app");