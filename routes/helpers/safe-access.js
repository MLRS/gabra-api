module.exports =
  // https://medium.com/javascript-inside/safely-accessing-deeply-nested-values-in-javascript-99bf72a0855a
  function (obj, path) {
    if (!Array.isArray(path)) path = [path]
    return path.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, obj)
  }
