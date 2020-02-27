/* globals Vue axios */
/* eslint-disable no-new */
new Vue({
  el: '#app',
  data: {
    working: false,
    query: 'kiteb', // TODO get from query string
    page: 0,
    results: [],
    resultCount: 0
  },
  computed: {
    moreResults: function () {
      return this.results.length < this.resultCount
    }
  },
  mounted: function () {
    this.loadResults()

    // https://renatello.com/check-if-a-user-has-scrolled-to-the-bottom-in-vue-js/
    window.onscroll = () => {
      let bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight
      if (bottomOfWindow && !this.working && this.moreResults) {
        this.loadResults()
      }
    }
  },
  methods: {
    // get results
    loadResults: function () {
      this.working = true
      axios.get(`/lexemes/search`, {
        params: {
          s: this.query,
          l: 1,
          wf: 1,
          g: 1,
          pending: 1,
          page: ++this.page
        } })
        .then(response => {
          response.data.results.forEach(r => {
            r.wordforms = null // not loaded (yet)
            this.results.push(r)
            axios.get(`/lexemes/wordforms/${r.lexeme._id}`)
              .then(resp => {
                r.wordforms = resp.data
              })
              .catch(error => {
                console.error(error)
                r.wordforms = []
              })
          })
          this.resultCount = response.data.query.result_count
        })
        .catch(error => {
          console.error(error)
        })
        .then(() => {
          this.working = false
        })
    }
  }
})
