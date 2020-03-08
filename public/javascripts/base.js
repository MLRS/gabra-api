/* globals axios GabraAPI sessionStorage */
GabraAPI.login = function () {
  axios.get(GabraAPI.baseURL + '/auth/login')
    .then(resp => {
      sessionStorage.setItem('user', JSON.stringify(resp.data))
      // GabraAPI.checkLoggedIn()
      window.location.reload()
    })
    .catch(err => { // eslint-disable-line handle-callback-err
      sessionStorage.removeItem('user')
    })
}

GabraAPI.checkLoggedIn = function () {
  let user
  try {
    user = JSON.parse(sessionStorage.getItem('user'))
  } catch (err) {}
  let btn = document.getElementById('btn-user')
  if (user) {
    btn.children[1].innerText = user.username
    btn.disabled = true
    btn.removeEventListener('click', GabraAPI.login)
    return true
  } else {
    btn.children[1].innerText = 'Login'
    btn.disabled = false
    btn.addEventListener('click', GabraAPI.login)
    return false
  }
}
