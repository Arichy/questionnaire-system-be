'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/login', controller.account.login); // 登陆
  router.post('/signup', controller.account.signup); // 注册
  router.get('/getInfo', app.jwt, controller.account.getInfo); // 获得个人信息
  router.post(
    '/questionnaire_manager/post',
    app.jwt,
    controller.questionnaireManager.post,
  ); // 发布问卷
  router.get(
    '/questionnaire_manager/get',
    app.jwt,
    controller.questionnaireManager.get,
  ); // 查询自己发布的所有问卷

  router.get(
    '/questionnaire_manager/get_my_filled',
    app.jwt,
    controller.questionnaireManager.getMyFilled,
  ); // 查询自己填写的所有问卷

  router.get('/get_all_questionnaire', controller.home.getAllQuestionnaire); // 获得所有问卷
  router.get('/get_questionnaire', controller.home.getQuestionnaire); // 获得一个问卷的数据
  router.post(
    '/fill_questionnaire',
    app.jwt,
    controller.home.fillQuestionnaire,
  ); // 填写一个问卷
};
