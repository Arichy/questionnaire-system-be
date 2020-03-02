import { Controller } from 'egg';

export default class AccountController extends Controller {
  async login() {
    const { ctx } = this;

    try {
      const res = await ctx.service.account.login();
    } catch (err) {}
  }

  async signup() {
    const { ctx } = this;

    await ctx.service.account.signup();
  }

  async getInfo() {
    const { ctx } = this;

    await ctx.service.account.getInfo();
  }
}
