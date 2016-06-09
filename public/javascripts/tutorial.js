/* global $ JSONEditor GabraAPI */
$(document).ready(function () {

  // Rearrange page
  var editor = $('#editor')
  var col_cont = $('<div>').addClass('container')
  var col_left = $('<div>').addClass('col-md-6')
  var col_right = $('<div>').addClass('col-md-6')
  col_cont.append(
    col_left,
    col_right
  ).insertBefore(editor)

  // TODO: be less dependent on title names
  editor.appendTo(col_left)
  $('h4#add-a-known-field').prev().nextUntil($('#bulk-replace')).appendTo(col_right)

  $.getJSON(GabraAPI.baseURL + '/schemas/lexeme.json', function (schema) {
    JSONEditor.defaults.options.ajax = true
    JSONEditor.defaults.options.theme = 'bootstrap3'
    JSONEditor.defaults.options.iconlib = 'bootstrap3'
    JSONEditor.defaults.options.remove_empty_properties = true
    JSONEditor.defaults.options.disable_edit_json = false
    var editor_element = document.getElementById('editor')
    var editor = new JSONEditor(editor_element, {
      schema: schema,
      startval: {
        'lemma': 'kiteb',
        'pos': 'VERB',
        'root': {
          'radicals': 'k-t-b'
        },
        'gloss': 'write',
        'derived_form': 1
      }
    })
  })
})
