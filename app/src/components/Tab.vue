<template>
  <div>
    <b-card>
      <b-tabs v-model="tabIndex" card>
   
        <b-tab title="HOME" :title-link-class="linkClass(0)" active><Home></Home></b-tab>
        <b-tab title="TEST" :title-link-class="linkClass(1)"><ModelTest></ModelTest></b-tab>
         <!-- <b-tab title="SETTING" :title-link-class="linkClass(0)"></b-tab> -->
        <!-- <b-tab title="test" :title-link-class="linkClass(2)"><Test></Test></b-tab> -->
      </b-tabs>
    </b-card>
  </div>
</template>


<script>
// import BotFooter from "./components/BotFooter";
import Home from "./tabs/Home";
import ModelTest from "./tabs/Test";
// import Test from "./Test"
export default {
  name: "Tab",
  components: {
    Home,
    // Test,
    ModelTest
  },
  data() {
      return {
        tabIndex: 0
      }
    },
    created: function(){
         this.$socket.on('customEmit', function(data){ console.log(data)});
    },
    methods: {
      linkClass(idx) {
        if (this.tabIndex === idx) {
          return ['bg-primary', 'text-light']
        } else {
          return ['bg-light', 'text-info']
        }
      }
    }
};
</script>

<style scoped lang="scss">
  .container /deep/ {
    @import "~bootstrap-vue/dist/bootstrap-vue";
    @import "~bootstrap/dist/css/bootstrap";
  }
</style>