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
    search: null, // linked to input
    replace: null, // linked to input
    onlyShowChanged: false,
    newSurfaceForms: new Map(),
    wordforms: [],
    tested: false, // when true can commit
    error: null
  },
  computed: {
    wordformFields: function () {
      if (!this.wordforms || this.wordforms.length === 0) return []
      let fields = new Set(['_id', 'surface_form'], Object.keys(this.wordforms[0]))
      for (let i = 1; i < this.wordforms.length; i++) {
        for (let f in this.wordforms[i]) {
          fields.add(f)
        }
      }
      let exclude = new Set(['lexeme_id'])
      exclude.forEach((f) => fields.delete(f))
      return Array.from(fields)
    },
    wordformsFiltered: function () {
      if (this.onlyShowChanged) {
        return this.wordforms.filter(wf => this.newSurfaceForms.has(wf._id))
      } else {
        return this.wordforms
      }
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
      axios.get(`${baseURL}/lexemes/wordforms/${this.lexemeID}?pending=1`)
        .then(response => {
          this.wordforms = response.data
        })
        .catch(error => {
          console.error(error)
          this.error = error
        })
        .then(() => {
          this.working = false
        })
    },
    previewReplace: function () {
      this.working = true
      this.error = null
      this.newSurfaceForms = new Map()
      let url = `${baseURL}/wordforms/replace/${this.lexemeID}`
      axios.post(url, {
        search: this.search,
        replace: this.replace,
        commit: false
      })
        .then(response => {
          response.data.forEach(wf => {
            this.newSurfaceForms.set(wf._id, wf.surface_form)
          })
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
    commitReplace: function () {
      this.working = true
      this.error = null
      let url = `${baseURL}/wordforms/replace/${this.lexemeID}`
      axios.post(url, {
        search: this.search,
        replace: this.replace,
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
