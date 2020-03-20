/* global axios JSONEditor GabraAPI */
axios.get(`${GabraAPI.baseURL}/schemas/lexeme.json`)
  .then(response => {
    const editor_element = document.getElementById('editor')
    const editor = new JSONEditor(editor_element, { // eslint-disable-line no-unused-vars
      schema: response.data,
      startval: {
        'lemma': 'kiteb',
        'pos': 'VERB',
        'root': {
          'radicals': 'k-t-b'
        },
        'gloss': 'write',
        'derived_form': 1
      },
      theme: 'bootstrap4',
      iconlib: 'fontawesome5',
      compact: true,
      display_required_only: true,
      remove_empty_properties: true
    })
  })
