module.exports = {
  // This exists because Monk has no replace function (yet)
  prepareUpdateOperations: function (oldDoc, newDoc) {
    var unset = {} // fields to unset
    Object.keys(oldDoc).forEach(k => {
      if (!Object.keys(newDoc).includes(k)) {
        unset[k] = 1
      }
    })
    delete unset._id
    delete newDoc._id
    var updateOps = {
      $set: newDoc
    }
    if (Object.keys(unset).length > 0) {
      updateOps['$unset'] = unset
    }
    return updateOps
  }
}
