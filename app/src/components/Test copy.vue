  <template>
    <div>
  <b-form inline>
    <label class="sr-only" for="inline-form-input-name">Name</label>
    <b-input
      id="inline-form-input-name"
      class="mb-2 mr-sm-2 mb-sm-0"
      placeholder="Jane Doe"
    ></b-input>

    <label class="sr-only" for="inline-form-input-username">Username</label>
    <b-input-group prepend="@" class="mb-2 mr-sm-2 mb-sm-0">
      <b-input id="inline-form-input-username" placeholder="Username"></b-input>
    </b-input-group>

    <b-form-checkbox class="mb-2 mr-sm-2 mb-sm-0">Remember me</b-form-checkbox>

    <b-button variant="primary">Save</b-button>
  </b-form>
</div>
  </template>

  <script>
    export default {
      name: "Test",
      data() {
        return {
          form: {
            email: '',
            name: '',
            food: null,
            checked: []
          },
          foods: [{ text: 'Select One', value: null }, 'Carrots', 'Beans', 'Tomatoes', 'Corn'],
          show: true
        }
      },
      methods: {
        onSubmit(evt) {
          evt.preventDefault()
          alert(JSON.stringify(this.form))
        },
        onReset(evt) {
          evt.preventDefault()
          // Reset our form values
          this.form.email = ''
          this.form.name = ''
          this.form.food = null
          this.form.checked = []
          // Trick to reset/clear native browser form validation state
          this.show = false
          this.$nextTick(() => {
            this.show = true
          })
        }
      }
    }
  </script>
  <style scoped lang="scss">
    .container /deep/ {
      @import "~bootstrap-vue/dist/bootstrap-vue";
      @import "~bootstrap/dist/css/bootstrap";
    }
  </style>