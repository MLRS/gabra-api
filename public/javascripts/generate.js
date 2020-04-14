/* globals Vue axios GabraAPI */
/* eslint-disable no-new */
const baseURL = GabraAPI.baseURL
const pageURL = GabraAPI.pageURL
new Vue({
  el: '#app',
  data: {
    working: false,
    lexemeID: window.location.pathname.split('/').reverse()[0],
    lexeme: null, // once loaded, values can be updated via form
    paradigms: null, // all options
    paradigm: null, // currently chosen, linked to select
    form: {}, // inputted data
    wordforms: [],
    tested: false, // when true can commit
    error: null
  },
  computed: {
    // Fields to show in form, based on currently selected paradigm
    formFields: function () {
      if (this.paradigms && this.paradigm) {
        return this.paradigms[this.paradigm].fields
      }
    },
    wordformFields: function () {
      if (!this.wordforms || this.wordforms.length === 0) return []
      let fields = new Set(['surface_form'])
      for (let i = 0; i < this.wordforms.length; i++) {
        for (let f in this.wordforms[i]) {
          fields.add(f)
        }
      }
      let exclude = new Set(['lexeme_id'])
      exclude.forEach((f) => fields.delete(f))
      return Array.from(fields)
    }
  },
  mounted: function () {
    this.loadParadigms()
    this.loadLexeme()
  },
  methods: {
    loadParadigms: function () {
      this.working = true
      this.error = null
      axios.get(`${baseURL}/wordforms/generate`)
        .then(response => {
          this.paradigms = response.data
        })
        .catch(error => {
          console.error(error)
          this.error = error
        })
        .then(() => {
          this.working = false
        })
    },
    // get lexeme from ID
    loadLexeme: function () {
      this.working = true
      this.error = null
      axios.get(`${baseURL}/lexemes/${this.lexemeID}`)
        .then(response => {
          this.lexeme = response.data
          switch (this.lexeme.pos) {
            case 'NOUN':
              this.paradigm = 'noun'
              break
            case 'ADJ':
              this.paradigm = 'adjective'
              break
            case 'VERB':
              this.paradigm = 'loan-verb'
              break
          }
        })
        .catch(error => {
          console.error(error)
          this.error = error
        })
        .then(() => {
          this.working = false
        })
    },
    generateWordforms: function () {
      if (!this.paradigm) return
      if (!this.lexeme) return
      this.working = true
      this.error = null
      let url = `${baseURL}/wordforms/generate/${this.paradigm}/${this.lexemeID}`
      this.lexeme.commit = false
      axios.post(url, this.lexeme)
        .then(response => {
          this.wordforms = response.data
          this.tested = true
        })
        .catch(error => {
          console.error(error)
          this.error = error
        })
        .then(() => {
          this.working = false
        })
    },
    commitWordforms: function () {
      if (!this.paradigm) return
      if (!this.lexeme) return
      this.working = true
      this.error = null
      let url = `${baseURL}/wordforms/generate/${this.paradigm}/${this.lexemeID}`
      this.lexeme.commit = true
      axios.post(url, this.lexeme)
        .then(response => {
          window.location = `${pageURL}/view/${this.lexemeID}`
        })
        .catch(error => {
          this.error = error
          console.error(error)
        })
        .then(() => {
          this.working = false
        })
    },
    cancel: function () {
      window.location = `${pageURL}/view/${this.lexemeID}`
    }
  }
})
