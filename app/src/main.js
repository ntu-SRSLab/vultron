import Vue from "vue";
import App from "./App.vue";

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Popper from 'popper.js'
Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false
global.Popper = Popper;

// Install BootstrapVue
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");

