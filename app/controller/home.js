'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  async getAllQuestionnaire() {
    try {
      await this.ctx.service.home.getAllQuestionnaire();
    } catch (err) {}
  }

  async getQuestionnaire() {
    try {
      const user_id = await this.ctx.service.account.getUserId();
      const { questionnaire_id } = this.ctx.query;

      this.ctx.body = {};

      if (
        await this.ctx.service.questionnaireManager.hasFilled({
          user_id,
          questionnaire_id,
        })
      ) {
        this.ctx.body = { success: true, status: -1 };
      }

      await this.ctx.service.home.getQuestionnaire({ user_id });
    } catch (err) {
      this.app.logger.error(err);
    }
  }

  async fillQuestionnaire() {
    try {
      const user_id = await this.ctx.service.account.getUserId();
      const { questionnaire_id } = this.ctx.request.body;

      if (
        await this.ctx.service.questionnaireManager.hasFilled({
          user_id,
          questionnaire_id,
        })
      ) {
        this.ctx.body = { success: false, msg: '你已填写过该问卷' };
      } else {
        await this.ctx.service.home.fillQuestionnaire();
      }
    } catch (err) {}
  }
}

module.exports = HomeController;
