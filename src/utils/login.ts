const config = require('config');

module.exports = {
  url: config.get('login.url'),
  emailInput: 'input[name=email]',
  passwordInput: 'input[name=password]',
  submitButton: 'button[type=submit]'
};