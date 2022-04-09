function login_get(req, res) {
  res.render('login');
}

function login_post(req, res) {
  console.log(req.cookies);
  console.log(req.cookies.Cookie_2);
  console.log(res.headers);
}

module.exports = { login_get, login_post };
