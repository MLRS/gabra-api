/* Fixes to data as a result of schema testing
 * 2019-05-31
 */

/* global db */

// -- Lexemes ---

// alternatives: ''
db.getCollection('lexemes').update({ 'alternatives': '' }, { $unset: { 'alternatives': true } }, { multi: true })

// alternatives: []
db.getCollection('lexemes').update({ 'alternatives': [] }, { $unset: { 'alternatives': true } }, { multi: true })

// gender: null
db.getCollection('lexemes').update({ 'gender': { $exists: true, $eq: null } }, { $unset: { 'gender': true } }, { multi: true })

// gender: ''
db.getCollection('lexemes').update({ 'gender': '' }, { $unset: { 'gender': true } }, { multi: true })

// pos: ''
db.getCollection('lexemes').update({ 'pos': '' }, { $unset: { 'pos': true } }, { multi: true })

// pos: null
db.getCollection('lexemes').update({ 'pos': { $exists: true, $eq: null } }, { $unset: { 'pos': true } }, { multi: true })

// root: null
db.getCollection('lexemes').update({ 'root': { $exists: true, $eq: null } }, { $unset: { 'root': true } }, { multi: true })

// pending: ''
db.getCollection('lexemes').update({ 'pending': '' }, { $unset: { 'pending': true } }, { multi: true })

// pending: '1'
db.getCollection('lexemes').update({ 'pending': '1' }, { $set: { 'pending': true } }, { multi: true })

// --- Wordforms ---

// empty strings in agr objects
db.getCollection('wordforms').update({ 'subject.person': '' }, { $set: { 'subject.person': null } }, { multi: true }) // 156
db.getCollection('wordforms').update({ 'dir_obj': '' }, { $set: { 'dir_obj': null } }, { multi: true }) // 531
db.getCollection('wordforms').update({ 'ind_obj': '' }, { $set: { 'ind_obj': null } }, { multi: true }) // 531

// form: ''
db.getCollection('wordforms').update({ 'form': '' }, { $unset: { 'form': true } }, { multi: true })

// polarity: ''
db.getCollection('wordforms').update({ 'polarity': '' }, { $unset: { 'polarity': true } }, { multi: true })

// gender: ''
db.getCollection('wordforms').update({ 'gender': '' }, { $unset: { 'gender': true } }, { multi: true })
