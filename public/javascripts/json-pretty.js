function JSONPretty (obj, depth) {
  if (!depth) {
    depth = 0
  }

  // get width
  var width = 0
  for (var k in obj) {
    width = Math.max(width, k.length)
  }

  function repeat (c, n) {
    return Array(n + 1).join(c)
  }

  var out = ''
  out += '<div class="json-object">'
  for (k in obj) {
    var v = obj[k]
    out += '<div class="json-row">'
    out += repeat(' ', depth)
    out += '<span class="json-key">' + k + '</span>'
    out += repeat(' ', width - k.length)
    out += '<span class="json-colon">:</span>'
    if (v && v.constructor === Array) {
      out += '<span class="json-value">'
      out += JSON.stringify(v)
      out += '</span>'
    } else if (typeof v === 'object') {
      out += JSONPretty(v, depth + 2)
    } else {
      out += '<span class="json-value">' + v + '</span>'
    }
    out += '</div>'
  }
  out += '</div>'

  return out
}
