<template>
  <div class="container">
          <div>
        <b-dropdown id="dropdown-dropup" dropup text="Drop-Up" variant="primary" class="m-2">
          <b-dropdown-item href="#">Action</b-dropdown-item>
          <b-dropdown-item href="#">Another action</b-dropdown-item>
          <b-dropdown-item href="#">Something else here</b-dropdown-item>
        </b-dropdown>
      </div>
  </div>
</template>


<script>
  export default {
    name: "Deploy",
    data: function () {
      return {
        selected: [],
        log: ""
      };
    },
    methods: {
      onFileChange(e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        console.log(files);
        this.selected = [];
        for (var file of files) {
          this.selected.push({
            contract: file.name
          });
        }
      },
      OnUpload(e) {
        console.log(e);
        this.log = "upload contracts to server:" + JSON.stringify(this.selected);
        // alert(e.toString() + "upload to server:" + JSON.stringify(this.selected));
      },
      OnCompile(e) {
        console.log(e);
        this.log = "compiled:" + JSON.stringify(this.selected);
        // alert(e.toString() + "compiled:" + JSON.stringify(this.selected));
      }
    },
    props: {
      msg: String
    }
  };
</script>

<style scoped lang="scss">
  .container /deep/ {
    @import "~bootstrap-vue/dist/bootstrap-vue";
    @import "~bootstrap/dist/css/bootstrap";
  }
</style>