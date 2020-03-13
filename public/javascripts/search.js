/* globals Vue axios confirm alert GabraAPI */
/* eslint-disable no-new */
const baseURL = GabraAPI.baseURL
const urlParams = new URLSearchParams(window.location.search)
new Vue({
  el: '#app',
  data: {
    working: false,
    lexemeID: urlParams.get('id'),
    query: urlParams.get('s'),
    page: 1,
    results: [],
    resultCount:'...',
    loggedIn: GabraAPI.checkLoggedIn()
  },
  computed: {
    moreResults: function () {
      return Number.isInteger(this.resultCount) && this.results.length < this.resultCount
    }
  },
  mounted: function () {
    if (this.lexemeID) {
      this.loadLexeme()
    } else if (this.query) {
      this.loadResults()
    }

    // https://renatello.com/check-if-a-user-has-scrolled-to-the-bottom-in-vue-js/
    window.onscroll = () => {
      let bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight
      if (bottomOfWindow && !this.working && this.moreResults) {
        this.loadResults(++this.page)
      }
    }
  },
  methods: {
    // get lexeme
    loadLexeme: function () {
      this.working = true
      axios.get(`${baseURL}/lexemes/${this.lexemeID}`)
        .then(response => {
          this.resultCount = 1
          let r = {
            lexeme: response.data,
            wordforms: null // not loaded (yet)
          }
          this.results = [r]
          axios.get(`${baseURL}/lexemes/wordforms/${response.data._id}`)
            .then(resp => {
              r.wordforms = resp.data
              r.wordformFields = this.collectFields(resp.data)
            })
            .catch(error => {
              console.error(error)
              r.wordforms = []
            })
        })
        .catch(error => {
          console.error(error)
        })
        .then(() => {
          this.working = false
        })
    },
    // get search results
    loadResults: function (page = 1) {
      this.working = true
      axios.get(`${baseURL}/lexemes/search`, {
        params: {
          s: this.query,
          l: 1,
          wf: 1,
          g: 1,
          pending: 1,
          page: page
        } })
        .then(response => {
          this.resultCount = response.data.query.result_count
          response.data.results.forEach(r => {
            r.wordforms = null // not loaded (yet)
            this.results.push(r)
            axios.get(`${baseURL}/lexemes/wordforms/${r.lexeme._id}`)
              .then(resp => {
                r.wordforms = resp.data
                r.wordformFields = this.collectFields(resp.data)
              })
              .catch(error => {
                console.error(error)
                r.wordforms = []
              })
          })
        })
        .catch(error => {
          console.error(error)
        })
        .then(() => {
          this.working = false
        })
    },
    collectFields: function (wordforms) {
      if (!wordforms || wordforms.length === 0) return []
      let fields = new Set(['_id', 'surface_form'], Object.keys(wordforms[0]))
      for (let i = 1; i < wordforms.length; i++) {
        for (let f in wordforms[i]) {
          fields.add(f)
        }
      }
      let exclude = new Set(['lexeme_id'])
      exclude.forEach((f) => fields.delete(f))
      return Array.from(fields)
    },
    deleteLexeme: function (id) {
      if (!id) return
      if (!confirm(`Are you sure you want to delete lexeme ${id}?`)) return
      axios.delete(`${baseURL}/lexemes/${id}`)
        .then(response => {
          window.location.reload()
        })
        .catch(error => {
          alert(error)
        })
    },
    deleteWordform: function (lexeme_id, wf_id) {
      if (!lexeme_id || !wf_id) return
      if (!confirm(`Are you sure you want to delete wordform ${wf_id}?`)) return
      axios.delete(`${baseURL}/wordforms/${wf_id}`)
        .then(response => {
          this.results.forEach(r => {
            if (r.lexeme._id === lexeme_id) {
              r.wordforms = r.wordforms.filter(wf => {
                return wf._id !== wf_id
              })
            }
          })
        })
        .catch(error => {
          alert(error)
        })
    }
  }
})
