/* eslint valid-jsdoc: "off" */

'use strict';

const _ = require('lodash');

const isDevelopment = process.env.NODE_ENV.toLowerCase() === 'development';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {
    security: {
      domainWhiteList: ['http://localhost:8080', 'http://127.0.0.1:8080'],
      csrf: {
        enable: false,
      },
    },
  });

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1582453363173_3210';

  // add your middleware config here
  config.middleware = ['handleIdType'];

  config.cors = {
    origin: isDevelopment ? 'http://localhost:8080' : 'http://60.205.179.88',
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  config.mysql = {
    client: {
      host: '60.205.179.88',
      port: '3306',
      user: 'root',
      password: _.chain([
        ['l'],
        false,
        [['s']],
        0,
        null,
        ['m'],
        undefined,
        ['n'],
        '',
      ])
        .flattenDeep()
        .compact()
        .reverse()
        .join('')
        .repeat(6)
        .value(),
      database: 'questionnaire_system_2',
    },
  };

  config.jwt = {
    secret: 'QUESTIONNAIRE_SYSTEN_2020',
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
