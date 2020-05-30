        <template>
            <!-- Navigation -->
        <nav class="navbar navbar-default navbar-fixed-top">
        <div class="container-fluid">
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
        <a class="navbar-brand" href="#page-top">Vultron</a>
        
        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#my-navbar-collapse">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar">hello world</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            hello world
        </button>
        </div>
        <!-- Collect the nav links, forms, and other content for toggling -->
        <div class="collapse navbar-collapse" id="my-navbar-collapse">
        <ul class="nav navbar-nav navbar-right">
            <li class="hidden"><a href="#page-top"></a></li>
            <li><a href="#">About</a></li>
            <!--li><a href="#under">Under the Hood</a></li-->
            <li><a href="#">Publications</a></li>
            <li><a href="#">People</a></li>
        </ul>
        </div>
        </div>
        </nav>
       
 </template>
<script>
    export default {
    name: "NavHeader",
    props: {
        msg: String
    }
    };
</script>
<style scoped lang="scss">
.navbar /deep/ {
  @import "~bootstrap-vue/dist/bootstrap-vue";
}
</style>
