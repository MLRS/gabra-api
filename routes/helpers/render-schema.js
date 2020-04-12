/**
 * Read JSON schema from file and format as HTML table
 */
const fs = require('fs')

module.exports = function (file, baseURL) {
  let data = fs.readFileSync(`public/schemas/${file}`, 'utf8')
  let stats = fs.statSync(`public/schemas/${file}`)
  let html = `
    <table class="table">
    <thead>
      <tr>
        <th>Field</th>
        <th>Type</th>
        <th>Description</th>
        <th style="width:40%">Example / allowed values</th>
      </tr>
    </thead>
    <tbody>
  `
  data = JSON.parse(data)
  for (let p in data.properties) {
    let po = data.properties[p]
    let eg = ''
    if (po.examples) {
      eg = po.examples.map(e => `<code>${JSON.stringify(e)}</code>`).join(',<br>')
    } else if (po.enum) {
      eg = po.enum.map(e => `<code>${JSON.stringify(e)}</code>`).join(' / ')
    }
    let refType
    if (po['$ref'] && po['$ref'].startsWith('#/')) { // e.g. '#/definitions/agr'
      let keys = po['$ref'].split('/').slice(1) // e.g. ['definitions','agr']
      refType = keys.reduce((acc, val) => acc[val], data)['type']
    }
    html += `
      <tr>
        <td class="text-nowrap"><code>${p}</code></td>
        <td>${po.type || refType}</td>
        <td>${po.description || ''}${data.required.includes(p) ? '<div class="small text-muted">Required</div>' : ''}</td>
        <td>${eg}</td>
      </tr>
    `
  }
  html += `
    </tbody>
    </table>
    <p>
      Source: <a href="${baseURL}/schemas/${file}">${file}</a><br>
      <small class="text-muted">Last updated ${stats.mtime.toISOString()}</small>
    </p>
  `
  return html
}
