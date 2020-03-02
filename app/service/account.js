import { Service } from 'egg';
import { omit } from 'lodash';

export default class AccountService extends Service {
  async login() {
    const { ctx, app } = this;

    const {
      request: { body },
    } = ctx;

    const { username, email, password } = body;

    const md5Password = ctx.helper.genPassword(password);

    const result = await app.mysql.get('user', {
      username,
      password: md5Password,
      email,
    });

    if (result === null) {
      ctx.body = { success: false, msg: '用户名或邮箱或密码错误' };
    } else {
      const { user_id } = result;
      const token = app.jwt.sign({ user_id }, app.config.jwt.secret, {
        expiresIn: '1h',
      });

      ctx.body = { success: true, msg: '登录成功', token };
    }
  }

  async signup() {
    const { ctx } = this;

    const {
      request: { body },
    } = ctx;

    const { username, email, company: company_name, password } = body;

    try {
      await this.app.mysql.insert('user', {
        username,
        email,
        company_name,
        password: ctx.helper.genPassword(password),
      });

      ctx.body = { success: true, msg: '注册成功' };
    } catch (err) {
      ctx.logger.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        ctx.body = { success: false, msg: '注册失败，该用户名或邮箱已被注册' };
      } else {
        ctx.body = { success: false, msg: '注册失败，请稍后再试' };
      }
    }
  }

  async getUserId() {
    const { ctx, app } = this;
    const { authorization } = ctx.header;
    const token = authorization.split(' ')[1];

    const payload = await app.jwt.verify(token, app.config.jwt.secret);

    const { user_id } = payload;

    return user_id;
  }

  async getInfo() {
    const { ctx, app } = this;

    const user_id = await this.getUserId();

    const result = await app.mysql.get('user', { user_id });

    ctx.body = { success: true, data: omit(result, 'password') };
  }
}
