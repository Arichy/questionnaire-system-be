import { Service } from 'egg';
import _ from 'lodash';

export default class QuestionnaireManagerService extends Service {
  async post({ user_id }) {
    const { ctx, app } = this;
    const {
      request: { body },
    } = ctx;

    const { title = '', startTime = 0, endTime = 0, questionArr = [] } = body;

    try {
      const result = await app.mysql.beginTransactionScope(async conn => {
        const { insertId } = await conn.insert('publisher', {
          user_id,
          questionnaire_name: title,
          start_time: startTime,
          end_time: endTime,
          status: ctx.helper.getQuestionnaireStatus(startTime, endTime),
          fill_count: 0,
        });

        const insertQuestionArr = questionArr.map(
          ({ question_name, question_type, options, option_max_num }) => {
            return {
              questionnaire_id: insertId,
              question_name,
              question_type,
              options: options.join('|'),
              option_max_num,
              options_count: options.map(() => 0).join('|'),
            };
          },
        );

        await conn.insert('questionnaire', insertQuestionArr);
      }, ctx);

      ctx.body = { success: true, msg: '成功发布问卷' };
    } catch (err) {
      app.logger.error(err);
      ctx.body = { success: false, msg: '发布失败，请稍后再试' };
    }
  }

  async get({ user_id }) {
    const { ctx, app } = this;
    const { query } = ctx;

    const { pageSize = 10, pageNum = 1 } = query;
    const limit = _.toNumber(pageSize);
    const offset = _.toNumber(pageSize * (pageNum - 1));

    try {
      const { result, total } = await app.mysql.beginTransactionScope(
        async conn => {
          const result = await conn.query(
            `
            SELECT publisher.*,questionnaire.*
            FROM (
              SELECT *
              FROM publisher
              WHERE user_id=?
              LIMIT ?,?
            ) AS publisher
            JOIN questionnaire
            ON publisher.questionnaire_id=questionnaire.questionnaire_id
          `,
            [user_id, offset, limit],
          );

          const count = await conn.query(
            `SELECT COUNT(questionnaire_id) FROM publisher WHERE user_id=?`,
            [user_id],
          );

          return {
            result,
            total: _.get(count, '[0]["COUNT(questionnaire_id)"', 0),
          };
        },
      );

      const data = _.chain(result)
        .groupBy('questionnaire_id')
        .map(ctx.helper.mergeQuestionnaireArr)
        .map(item => {
          const { start_time, end_time } = item;
          const status = ctx.helper.getQuestionnaireStatus(
            start_time,
            end_time,
          );
          return _.assign(item, { status });
        })
        .value();

      ctx.body = { success: true, data, total };
    } catch (err) {
      app.logger.error(err);
      ctx.body = { success: false, msg: '查询失败' };
    }
  }

  async hasFilled({ user_id, questionnaire_id }) {
    // 查询该用户是否已填写该问卷
    const { app } = this;
    try {
      const result = await app.mysql.select('answer', {
        where: {
          user_id,
          questionnaire_id,
        },
      });

      return result.length > 0;
    } catch (err) {
      app.logger.error(err);
      return true;
    }
  }

  async getMyFilled({ user_id }) {
    const { app, ctx } = this;

    const { query } = ctx;

    const { pageSize = 10, pageNum = 1 } = query;
    const limit = _.toNumber(pageSize);
    const offset = _.toNumber(pageSize * (pageNum - 1));

    try {
      const { result, total } = await app.mysql.beginTransactionScope(
        async conn => {
          const result = await conn.query(
            `
              SELECT publisher.*,answer.commit_time
              FROM (
                SELECT *
                FROM answer
                WHERE user_id=?
                GROUP BY questionnaire_id
                LIMIT ?,?
              ) AS answer
              JOIN publisher
              ON publisher.questionnaire_id=answer.questionnaire_id
           `,
            [user_id, offset, limit],
          );

          const count = await conn.query(
            `
          SELECT *,COUNT(questionnaire_id) 
          FROM answer 
          WHERE user_id=?
          GROUP BY questionnaire_id
          `,
            [user_id],
          );

          return {
            result,
            total: _.get(count, '[0]["COUNT(questionnaire_id)"', 0),
          };
        },
      );

      const data = _.map(result, item => {
        const { start_time, end_time } = item;
        const status = ctx.helper.getQuestionnaireStatus(start_time, end_time);
        return _.assign(item, { status });
      });

      ctx.body = { success: true, data, total };
    } catch (err) {
      ctx.body = { success: false, msg: '数据库错误' };
      app.logger.error(err);
    }
  }
}
