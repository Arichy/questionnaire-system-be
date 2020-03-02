require('@babel/register');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }
}

module.exports = AppBootHook;
