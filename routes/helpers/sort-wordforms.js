var agr_fields = {
  'number': ['sg', 'pl'],
  'person': ['p1', 'p2', 'p3'],
  'gender': ['m', 'f']
}

var fields = {
  'aspect': ['perf', 'impf', 'imp', 'prespart', 'pastpart'],
  'ind_obj': agr_fields,
  'dir_obj': agr_fields,
  'subject': agr_fields,
  'polarity': ['pos', 'neg'],
  'number': ['sg', 'sgv', 'coll', 'dl', 'pl', 'sp'],
  'gender': ['m', 'f', 'mf']
}

var sortF = function (a, b, fields) {
  for (var f in fields) {
    var has_a = a.hasOwnProperty(f)
    var has_b = b.hasOwnProperty(f)
    // if (!has_a && !has_b) continue
    // if (!has_a) return -1 // a is smaller
    // if (!has_b) return 1 // b is smaller

    var blank_a = !has_a || a[f] === null || a[f] === ''
    var blank_b = !has_b || b[f] === null || b[f] === ''
    if (blank_a && blank_b) continue
    if (blank_a) return -1 // a is smaller
    if (blank_b) return 1 // b is smaller

    if (typeof fields[f] === 'object' && !Array.isArray(fields[f])) {
      var s = sortF(a[f], b[f], fields[f])
      if (s === 0) continue
      else return s
    }

    var afx = fields[f].indexOf(a[f])
    var bfx = fields[f].indexOf(b[f])
    if (afx === -1) return 1
    if (bfx === -1) return -1
    if (afx !== bfx) return (afx - bfx)
    // otherwise keep going to next field
  }

  // nothing to compare on
  return 0
}

module.exports = function (a, b) {
  return sortF(a, b, fields)
}
