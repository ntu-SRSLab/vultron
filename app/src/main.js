import Vue from "vue";
import App from "./App.vue";
import Smcat from "state-machine-cat"
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import Popper from 'popper.js'
import VueKonva from 'vue-konva'
import JQuery from 'jquery'

Popper.Defaults.modifiers.computeStyle.gpuAcceleration = false
global.Popper = Popper;
Vue.prototype.$ = JQuery
Vue.prototype.$smcat = Smcat;
// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

Vue.use(VueKonva);

Vue.config.productionTip = false;

var vm =new Vue({
  render: h => h(App)
}).$mount("#app");
global.vm = vm; //Define you app variable globally