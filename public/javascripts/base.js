/* globals axios GabraAPI sessionStorage */
GabraAPI.toggleTheme = function () {
  let body = document.getElementsByTagName('body')[0]
  body.classList.toggle('bootstrap')
  body.classList.toggle('bootstrap-dark')
  if (body.classList.contains('bootstrap-dark')) {
    document.cookie = 'theme=dark'
  } else {
    document.cookie = 'theme=light'
  }
}

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
  if (user) {
    document.querySelectorAll('[login-show]').forEach(elem => { elem.classList.remove('d-none') })
    document.querySelectorAll('[login-hide]').forEach(elem => { elem.classList.add('d-none') })
    document.querySelectorAll('[login-username]').forEach(elem => { elem.innerText = user.username })
    return true
  } else {
    document.querySelectorAll('[login-show]').forEach(elem => { elem.classList.add('d-none') })
    document.querySelectorAll('[login-hide]').forEach(elem => { elem.classList.remove('d-none') })
    return false
  }
}
