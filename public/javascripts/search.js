/* global $, globals, GabraAPI, JSONPretty, show_loading, hide_loading */
/* global alert, confirm */

function loadResults () {
  show_loading('results')
  $('#btn-load-results').hide()
  $.ajax({
    url: GabraAPI.baseURL + '/lexemes/search',
    type: 'GET',
    data: globals.query,
    success: function (data) {
      globals.query.page++
      if (data.query.result_count !== null) {
        $('#result-count').text(data.query.result_count)
      }
      var elem = $('#results')
      data.results.forEach(function (item) {
        var wf_container = $('<div>').addClass('wf-container col-sm-8')
        elem.append(
          $('<div>').append(
            $('<h4>').attr('style', 'margin-top:1.5em').text(item.lexeme.lemma).append(
              ' ',
              $('<a>')
                .addClass('btn btn-xs btn-warning')
                .attr('href', GabraAPI.baseURL + '/lexemes/view/' + item.lexeme._id)
                .append(
                  $('<span>').addClass('glyphicon glyphicon-info-sign'),
                  ' View/Edit'
                ),
              ' ',
              $('<button>')
                .addClass('btn btn-xs btn-danger')
                .click(function () {
                  if (!confirm('Delete this entry?')) {
                    return false
                  }
                  $.ajax({
                    url: GabraAPI.baseURL + '/lexemes/' + item.lexeme._id,
                    type: 'DELETE',
                    success: function () {
                      window.location.reload()
                    }
                  })
                  return false
                })
                .append(
                  $('<span>').addClass('glyphicon glyphicon-remove'),
                  ' Delete'
                ),
              ' ',
              $('<a>')
                .addClass('btn btn-xs btn-link')
                .attr('href', GabraAPI.gabraURL + '/lexemes/view/' + item.lexeme._id)
                .append(
                  $('<span>').addClass('glyphicon glyphicon-new-window'),
                  ' View on Ġabra'
                )
            ),
            $('<div>').addClass('row').append(
              $('<pre>').addClass('json col-sm-4').html(JSONPretty(item.lexeme)),
              wf_container
            )
          )
        )
        $.ajax({
          url: GabraAPI.baseURL + '/lexemes/wordforms/' + item.lexeme._id + '?pending=1',
          type: 'GET',
          success: function (data) {
            if (data.length === 0 || data.length > 5) {
              wf_container.append(data.length + ' wordforms')
            } else {
              data.forEach(function (item) {
                wf_container.append(
                  $('<pre>').addClass('json col-sm-6').html(JSONPretty(item))
                )
              })
            }
          }
        })
      })
    }, // end of success
    error: function (err) {
      alert(err.statusText + '\n' + err.responseJSON.name + '\n' + err.responseJSON.err)
    },
    complete: function () {
      hide_loading('results')
      $('#btn-load-results').show()
    }
  })
}

$(document).ready(function () {
  $('#btn-toggle-wf').click(function () {
    $('.wf-container').toggle()
  })
  $('#btn-load-results').click(loadResults).trigger('click')
})
