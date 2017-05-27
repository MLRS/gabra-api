/* global $, globals, GabraAPI, JSONEditor, JSONPretty */
/* global show_loading, hide_loading */
/* global confirm */

// Store everything we load in this item so it's ready if we need to load editor
globals.cache = {}

function icon (key, text) {
  var span = $('<span>').addClass('glyphicon glyphicon-' + key)
  if (text) {
    return [span, '&nbsp;' + text]
  } else {
    return span
  }
}

function handle_err (err) {
  var msg = ''
  if (err.statusText) msg += err.statusText + '<br>'
  if (err.responseText) {
    msg += err.responseText + '<br>'
  }
  if (err.responseJSON) {
    msg += err.responseJSON.name + '<br>'
    msg += err.responseJSON.err
  }
  $('.container:nth(2)').before(
    $('<div>').addClass('alert alert-danger').html(msg)
  )
}

// --- Display data -------------------------------------------------------

function view_lexeme (data) {
  if (!data) {
    handle_err({
      responseText: 'No lexeme found for ' + globals.lexeme_id
    })
    return
  }
  globals.cache[data._id] = data
  var title = $('title').text()
  $('title').text(title.replace(data._id, data.lemma))
  var table = $('<table>').addClass('table table-condensed table-striped')
  $('#view-lexeme').text('').append(table)

  // Try to sort as best we can
  var orders = [
    '_id',
    'lemma',
    'alternatives',
    'pos',
    'root',
    'gloss',
    'sources'
  ]
  var fields = Object.keys(data)
  delete fields[ fields.indexOf('_id') ]
  delete fields[ fields.indexOf('lexeme_id') ]
  fields.sort(function (a, b) {
    var ax = orders.indexOf(a)
    var bx = orders.indexOf(b)
    if (ax === -1) return 1
    if (bx === -1) return -1
    return ax - bx
  })

  fields.forEach(function (field) {
    var out = handleField(data, field)
    table.append(
      $('<tr>').append(
        $('<th>').text(field),
        $('<td>').text(out)
      )
    )
  })
}

function view_wordforms (data, elem) {
  if (data.length === 0) return

  var table = $('<table>').addClass('table table-condensed table-striped table-hover')
  var thead = $('<thead>').appendTo(table)
  var tbody = $('<tbody>').appendTo(table)
  elem.append(table)

  // collect fields
  // var fields = Object.keys(data[0])
  var hide_fields = ['_id', 'lexeme_id', 'created', 'modified']
  // hide_fields.forEach(function (field) {
  //   delete fields[ fields.indexOf(field) ]
  // })
  var fields = []
  data.forEach(function (wf) {
    for (var field in wf) {
      if (fields.indexOf(field) === -1 && hide_fields.indexOf(field) === -1) {
        fields.push(field)
      }
    }
  })

  // Try to sort as best we can
  var orders = [
    'surface_form',
    'number',
    'gender',
    'aspect',
    'subject',
    'dir_obj',
    'ind_obj',
    'polarity'
  ]
  fields.sort(function (a, b) {
    var ax = orders.indexOf(a)
    var bx = orders.indexOf(b)
    if (ax === -1) return 1
    if (bx === -1) return -1
    return ax - bx
  })
  globals.cache['fields'] = fields

  var headings = $('<tr>')
  fields.forEach(function (field) {
    headings.append(
      $('<th>').text(field)
    )
  })
  headings.append(
      $('<th>').text('') // for edit button
  )
  thead.append(headings)

  data.forEach(function (wf) {
    tbody.append(view_wordform(fields, wf))
  })
  $('[data-toggle="tooltip"]').tooltip()
}

// Prepare single row wordform, return row as jQuery obj
function view_wordform (fields, wf) {
  globals.cache[wf._id] = wf
  var row = $('<tr>').attr('id', wf._id)
  // Fields
  fields.forEach(function (field) {
    var out = handleField(wf, field)
    row.append(
      $('<td>').text(out)
    )
  })

  // If no wf.id (e.g. they are generated suggestions), skip buttons
  if (!wf._id) {
    row.append(
      $('<td>')
    )
    return row
  }

  // Buttons
  var btn_history =
    $('<button>')
      .attr('type', 'button')
      .addClass('btn btn-xs btn-info')
      .append(
        icon('time')
      )
      .click(function () {
        load_history_wordform(wf._id)
      })
  var btn_edit =
    $('<button>')
      .attr('type', 'button')
      .addClass('btn btn-xs btn-warning')
      .append(
        icon('pencil')
      )
      .click(function () {
        edit_wordform(wf._id)
      })
  var btn_delete =
    $('<button>')
      .attr('type', 'button')
      .addClass('btn btn-xs btn-danger')
      .append(
        icon('remove')
      )
      .click(function () {
        if (!confirm('Really delete this wordform?')) return
        delete_wordform(wf._id)
      })
  row.append(
    $('<td>').addClass('text-nowrap').append(btn_history, ' ', btn_edit, ' ', btn_delete)
  )
  return row
}

function refresh_wordform (data) {
  var row = view_wordform(globals.cache.fields, data)
  $('tr#' + data._id).replaceWith(row)
}

function handleField (data, field) {
  var value = data[field]
  var out = ''
  if (value === null || typeof value === 'undefined') {
    out = ''
  } else if (Array.isArray(value)) {
    out = value
  } else if (field === 'gloss') {
    out = value.replace(/\n/g, ', ')
  } else if (typeof value === 'object') {
    var obj_fields = [
      'person',
      'number',
      'gender',
      'radicals',
      'variant'
    ]
    obj_fields.forEach(function (f) {
      if (value[f]) out += value[f] + ' '
    })
  } else {
    out = value
  }
  return out
}

// --- History ------------------------------------------------------------

function load_history_lexeme (id) {
  $('#history-modal h4').text('History for lexeme ' + id)
  return load_history('lexemes', id)
}

function load_history_wordform (id) {
  $('#history-modal h4').text('History for wordform ' + id)
  return load_history('wordforms', id)
}

function load_history (type, id) {
  $('#history-modal').modal('show')
  $('#history').text('')
  show_loading('history')
  $.ajax({
    method: 'GET',
    url: GabraAPI.baseURL + '/logs/' + type + '/' + id,
    success: view_history,
    error: handle_err,
    complete: function () {
      hide_loading('history')
    }
  })
}

function view_history (data) {
  var table = $('<table>').addClass('table table-condensed')
  var thead = $('<thead>').appendTo(table)
  thead.append(
    $('<tr>').append(
      $('<th>').text('Details'),
      $('<th>').text('Document')
    )
  )
  var tbody = $('<tbody>').appendTo(table)
  $('#history').text('').append(table)
  if (data.length > 0) {
    data.forEach(function (item) {
      tbody.append(
        $('<tr>').append(
          $('<td>').append(
            $('<div>').text(item.date),
            // Fields below are all optional
            $('<div>').addClass('text-primary').text(item.action),
            $('<div>').addClass('text-muted').text(item.username),
            $('<div>').addClass('text-muted').text(item.ip)
          ),
          $('<td>').append(
            item.new_value
            ? $('<pre>').addClass('json').html(JSONPretty(item.new_value))
            : '-'
          )
        )
      )
    })
    $('#btn-replace-commit').removeClass('disabled')
  } else {
    tbody.append(
      $('<tr>').append(
        $('<td>').attr('colspan', 2).text('No history')
      )
    )
  }
}

// --- Load data ----------------------------------------------------------

// Load lexeme
function load_lexeme (id) {
  show_loading('lexeme')
  $.ajax({
    method: 'GET',
    url: GabraAPI.baseURL + '/lexemes/' + id,
    success: view_lexeme,
    error: handle_err,
    complete: function () {
      hide_loading('lexeme')
    }
  })
}

// Load all wordforms
function load_wordforms (lexeme_id) {
  show_loading('wordforms')
  $('#view-wordforms').text('')
  $.ajax({
    method: 'GET',
    url: GabraAPI.baseURL + '/lexemes/wordforms/' + lexeme_id + '?pending=1',
    success: function (data) { view_wordforms(data, $('#view-wordforms')) },
    error: handle_err,
    complete: function () {
      hide_loading('wordforms')
    }
  })
}

// --- Editor -------------------------------------------------------------

// Set up editor
JSONEditor.defaults.options.ajax = true
JSONEditor.defaults.options.theme = 'bootstrap3'
JSONEditor.defaults.options.iconlib = 'bootstrap3'
JSONEditor.defaults.options.remove_empty_properties = true
JSONEditor.defaults.options.disable_edit_json = false
var editor_element = document.getElementById('editor')
var editor = null
$('#btn-edit-lexeme').click(function () {
  edit_lexeme(globals.lexeme_id)
})

$('#editor-modal').on('hidden.bs.modal', function (e) {
  if (editor) editor.destroy()
  editor = null
  $('#btn-editor-save').off()
})

function edit_lexeme (id) {
  editor = new JSONEditor(editor_element, {
    schema: globals.schemas.lexeme,
    form_name_root: 'lexeme',
    startval: (id) ? globals.cache[id] : {}
  }).on('ready', function () {
    highlight_fields(['lemma'])
    disable_fields(['_id', 'created', 'modified'])
    collapse_fields(['alternatives', 'sources'])
  })
  $('#btn-editor-save').click(function () {
    save_lexeme(id)
  })
  $('#editor-modal h4').text('Edit lexeme ' + id)
  $('#editor-modal').modal('show')
}

function edit_wordform (id) {
  $('[data-toggle="tooltip"]').tooltip('hide')
  editor = new JSONEditor(editor_element, {
    schema: globals.schemas.wordform,
    form_name_root: 'wordform',
    startval: (id) ? globals.cache[id] : { 'lexeme_id': globals.lexeme_id }
  }).on('ready', function () {
    highlight_fields(['surface_form'])
    disable_fields(['_id', 'lexeme_id', 'created', 'modified'])
    collapse_fields(['alternatives', 'sources'])
    $('<div>')
      .addClass('btn-group')
      .css('margin-left', '10px')
      .append(
        $('<button>')
          .addClass('btn btn-default')
          .append(icon('copy', 'Copy lemma'))
          .click(function () {
            var lemma = globals.cache[globals.lexeme_id].lemma
            editor.getEditor('root.surface_form').setValue(lemma)
          })
      )
      .appendTo($('#editor h3:first'))
  })
  $('#btn-editor-save').click(function () {
    save_wordform(id)
  })
  $('#editor-modal h4').text(id ? 'Edit wordform ' + id : 'Add wordform')
  $('#editor-modal').modal('show')
}

// Helpers for manipulating fields
var disable_fields = function (fields) {
  fields.forEach(function (field) {
    $(editor_element).find('div[data-schemapath$=".' + field + '"]').hide()
  })
}
var highlight_fields = function (fields) {
  fields.forEach(function (field) {
    $(editor_element).find('div[data-schemapath$=".' + field + '"] input').addClass('highlight')
  })
}
var collapse_fields = function (fields) {
  fields.forEach(function (field) {
    $(editor_element).find('div[data-schemapath$=".' + field + '"] .json-editor-btn-collapse').each(function () {
      var obj = $(this)
      // These are both massive hacks...
      if (obj.attr('title') === 'Collapse') {
      // if (obj.find('i.glyphicon-chevron-down').length)
        obj.trigger('click')
      }
    })
  })
}

// --- Save data ----------------------------------------------------------

function save_lexeme (id) {
  show_loading('editor')
  $.ajax({
    method: 'POST',
    url: GabraAPI.baseURL + '/lexemes/' + (id ? id : ''),
    contentType: 'application/json',
    data: JSON.stringify(editor.getValue()),
    success: function (data) {
      if (id === null) {
        // if new lexeme
        window.location.replace(GabraAPI.baseURL + '/lexemes/view/' + data._id)
      }
      view_lexeme(data)
      $('#editor-modal').modal('hide')
    },
    error: handle_err,
    complete: function () {
      hide_loading('editor')
    }
  })
}

function save_wordform (id) {
  show_loading('editor')
  $.ajax({
    method: 'POST',
    url: GabraAPI.baseURL + '/wordforms/' + (id ? id : ''),
    contentType: 'application/json',
    data: JSON.stringify(editor.getValue()),
    success: function (data) {
      // Have we added any new fields?
      var old = (id ? globals.cache[id] : {})
      var new_field = false
      for (var field in data) {
        if (!old.hasOwnProperty(field)) {
          new_field = true
          break
        }
      }
      if (new_field) {
        load_wordforms(data.lexeme_id)
      } else {
        refresh_wordform(data)
      }
      $('#editor-modal').modal('hide')
    },
    error: handle_err,
    complete: function () {
      hide_loading('editor')
    }
  })
}

function delete_wordform (id) {
  show_loading('wordforms')
  $.ajax({
    url: GabraAPI.baseURL + '/wordforms/' + id,
    type: 'DELETE',
    success: function () {
      $('tr#' + id).remove()
    },
    error: handle_err,
    complete: function () {
      hide_loading('wordforms')
    }
  })
}

// --- Bulk search / replace -------------------------------------------------

function replace_wordforms (lexeme_id, commit) {
  var search = $('#input-replace-search').val()
  var replace = $('#input-replace-replace').val()
  if (!replace) replace = ''
  if (!search) {
    $('#input-replace-search').parent().parent().addClass('has-error')
    return
  } else {
    $('#input-replace-search').parent().parent().removeClass('has-error')
  }
  commit = Boolean(commit)
  var success_test = function (data) {
    var table = $('<table>').addClass('table table-condensed table-striped')
    $('#replace-results').text('').append(table)
    if (data.length > 0) {
      data.forEach(function (item) {
        var old_sf = $('#' + item._id + ' td:first').text() // TODO don't like this
        var new_sf = item.surface_form
        table.append(
          $('<tr>').append(
            $('<td>').text(old_sf),
            $('<td>').text(' → '),
            $('<td>').text(new_sf)
          )
        )
      })
      $('#btn-replace-commit').removeClass('disabled')
    } else {
      table.append(
        $('<tr>').append(
          $('<td>').text('No matches')
        )
      )
    }
  }
  var success_commit = function (data) {
    $('#btn-replace-clear').trigger('click')
    $('#replace-modal').modal('hide')
    load_wordforms(lexeme_id)
  }

  show_loading('replace')
  $.ajax({
    method: 'POST',
    url: GabraAPI.baseURL + '/wordforms/replace/' + lexeme_id,
    contentType: 'application/json',
    data: JSON.stringify({
      search: search,
      replace: replace,
      commit: commit
    }),
    success: commit ? success_commit : success_test,
    error: handle_err,
    complete: function () {
      hide_loading('replace')
    }
  })
}

// --- Generate wordforms ----------------------------------------------------

function generate_wordforms (lexeme_id, commit) {
  var paradigm = $('#input-generate-paradigm').val()
  var lemma = globals.cache[lexeme_id]['lemma']
  commit = Boolean(commit)
  var success_test = function (data) {
    if (data.length > 0) {
      view_wordforms(data, $('#generate-results'))
      $('#btn-generate-commit').removeClass('disabled')
    }
  }
  var success_commit = function (data) {
    $('#generate-modal').modal('hide')
    load_wordforms(lexeme_id)
  }

  var url_extra = commit ? ('/' + lexeme_id) : ''
  show_loading('generate')
  $.ajax({
    method: 'POST',
    url: GabraAPI.baseURL + '/morpho/generate/' + paradigm + url_extra,
    contentType: 'application/json',
    data: JSON.stringify({
      lemma: lemma
    }),
    success: commit ? success_commit : success_test,
    error: handle_err,
    complete: function () {
      hide_loading('generate')
    }
  })
}

// --- Startup --------------------------------------------------------------

$(document).ready(function () {
  if (!globals.lexeme_id) {
    // New entry
    edit_lexeme(null)
    $('#btn-delete-lexeme, #btn-add-wordform, #btn-bulk-replace').addClass('disabled')
    return
  }

  // Startup stuff
  load_lexeme(globals.lexeme_id)
  load_wordforms(globals.lexeme_id)

  // Enable buttons
  $('#btn-add-wordform').click(function () {
    edit_wordform(null)
  })

  $('#btn-delete-lexeme').click(function () {
    if (!confirm('Delete entire entry (lexeme and associated wordforms)?')) return false
    show_loading('lexeme')
    $.ajax({
      url: GabraAPI.baseURL + '/lexemes/' + globals.lexeme_id,
      type: 'DELETE',
      success: function () {
        window.location.replace(GabraAPI.baseURL + '/')
      },
      error: handle_err,
      complete: function () {
        hide_loading('lexeme')
      }
    })
  })

  $('#btn-history-lexeme').click(function () {
    load_history_lexeme(globals.lexeme_id)
  })

  // Bulk replace

  $('#btn-bulk-replace').click(function () {
    $('#replace-modal').modal('show')
  })

  $('#input-replace-search, #input-replace-replace').change(function () {
    $('#btn-replace-commit').addClass('disabled')
  })

  $('#btn-replace-test').click(function () {
    replace_wordforms(globals.lexeme_id, false)
  })

  $('#btn-replace-commit').click(function () {
    var obj = $(this)
    if (obj.hasClass('disabled')) return false
    replace_wordforms(globals.lexeme_id, true)
  })

  $('#btn-replace-clear').click(function () {
    $('#input-replace-search').val('')
    $('#input-replace-replace').val('')
    $('#replace-results').text('')
    $('#btn-replace-commit').addClass('disabled')
  })

  // Generate

  $('#btn-generate').click(function () {
    $('#generate-modal').modal('show')
  })

  $('#input-generate-paradigm').change(function () {
    $('#btn-generate-commit').addClass('disabled')
    $('#generate-results').text('')
  })

  $('#btn-generate-test').click(function () {
    generate_wordforms(globals.lexeme_id, false)
  })

  $('#btn-generate-commit').click(function () {
    var obj = $(this)
    if (obj.hasClass('disabled')) return false
    generate_wordforms(globals.lexeme_id, true)
  })
})
