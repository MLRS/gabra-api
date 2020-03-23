/* globals Vue axios GabraAPI */
/* eslint-disable no-new */
const baseURL = GabraAPI.baseURL
const pageURL = GabraAPI.pageURL
new Vue({
  el: '#app',
  data: {
    working: false,
    lexemeID: window.location.pathname.split('/').reverse()[0],
    lexeme: null,
    paradigm: null, // linked to select
    wordforms: [],
    tested: false, // when true can commit
    error: null
  },
  computed: {
    wordformFields: function () {
      if (!this.wordforms || this.wordforms.length === 0) return []
      let fields = new Set(['surface_form'], Object.keys(this.wordforms[0]))
      for (let i = 1; i < this.wordforms.length; i++) {
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
    this.loadLexeme()
  },
  methods: {
    // get lexeme from ID
    loadLexeme: function () {
      this.working = true
      this.error = null
      axios.get(`${baseURL}/lexemes/${this.lexemeID}`)
        .then(response => {
          this.lexeme = response.data
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
      axios.post(url, {
        lemma: this.lexeme.lemma,
        commit: false
      })
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
      axios.post(url, {
        lemma: this.lexeme.lemma,
        commit: true
      })
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
