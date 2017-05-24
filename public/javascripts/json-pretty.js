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

  // known fields, in order (lexemes and wordforms combined)
  var orders = [
    '_id',
    'lexeme_id',
    'lemma',
    'surface_form',
    'phonetic',
    'alternatives',
    'pos',
    'root',
    'derived_form',
    'gender',
    'number',
    'gloss',
    'sources',
    'pending'
  ]
  var fields = Object.keys(obj)
  fields.sort(function (a, b) {
    var ax = orders.indexOf(a)
    var bx = orders.indexOf(b)
    if (ax === -1) return 1
    if (bx === -1) return -1
    return ax - bx
  })

  var out = ''
  out += '<div class="json-object">'
  for (var kx in fields) {
    var k = fields[kx]
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
    } else if (v === null) {
      out += '<span class="json-value json-null">null</span>'
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
