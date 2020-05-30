<template>
        <div class="container">
            <div class="jumbotron text-center">
                    <h1>Vultron</h1>
                    <p class="lead">The ultimate smart contract fuzzing framework</p>
                    <hr>
                    <form action="/load" method="post" enctype="multipart/form-data">
                        <div class="input-group">
                        <span class="input-group-addon" style="min-width:200px">Target Contract (.sol):</span>
                        <input type="file" accept=".sol" class="form-control" name="contract" required />
                        </div>
                        <div class="input-group">
                        <span class="input-group-addon" style="min-width:200px">Attack Contract (.sol):</span>
                        <input type="file" accept=".sol" class="form-control" name="contract" required />
                        </div>
                        <div class="input-group">
                        <span class="input-group-addon" style="min-width:200px">Target Contract (.json):</span>
                        <input type="file" accept=".json" class="form-control" name="contract" required />
                        </div>
                        <div class="input-group">
                        <span class="input-group-addon" style="min-width:200px">Attack Contract (.json):</span>
                        <input type="file" accept=".json" class="form-control" name="contract" required />
                        </div>
                        <br>
                        <button type="submit" class="btn btn-primary">Load Contracts</button>
                    </form> 
            </div>
    </div>
</template>
<script>
export default {
  name: "UploadAttack",
  props: {
    msg: String
  }
};
</script>

