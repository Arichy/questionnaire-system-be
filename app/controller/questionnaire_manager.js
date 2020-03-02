import { Controller } from 'egg';

export default class QuestionnaireManagerController extends Controller {
  async post() {
    const { ctx } = this;

    try {
      const user_id = await ctx.service.account.getUserId();
      const res = await ctx.service.questionnaireManager.post({ user_id });
    } catch (err) {}
  }

  async get() {
    // 获得我发布的
    const { ctx } = this;

    try {
      const user_id = await ctx.service.account.getUserId();
      const res = await ctx.service.questionnaireManager.get({ user_id });
    } catch (err) {}
  }

  async getMyFilled() {
    const { ctx } = this;
    try {
      const user_id = await ctx.service.account.getUserId();
      const res = await ctx.service.questionnaireManager.getMyFilled({
        user_id,
      });
    } catch (err) {}
  }
}
