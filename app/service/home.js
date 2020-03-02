import { Service, start } from 'egg';
import _ from 'lodash';

export default class HomeService extends Service {
  async getAllQuestionnaire() {
    const { ctx, app } = this;

    const { query } = ctx;

    const { pageSize = 10, pageNum = 1 } = query;
    const limit = _.toNumber(pageSize);
    const offset = _.toNumber(pageSize * (pageNum - 1));

    const { result, total } = await app.mysql.beginTransactionScope(
      async conn => {
        const result = _.chain(
          await conn.select('publisher', {
            limit,
            offset,
          }),
        )
          .map(item => {
            const { start_time, end_time } = item;
            const status = ctx.helper.getQuestionnaireStatus(
              start_time,
              end_time,
            );

            return _.assign(_.omit(item, ['fill_count']), { status });
          })
          .value();

        const count = await conn.query(
          `SELECT COUNT(questionnaire_id) FROM publisher;`,
        );

        return { result, total: count[0]['COUNT(questionnaire_id)'] };
      },
    );

    ctx.body = { success: true, data: result, total };
  }

  async getQuestionnaire({ user_id }) {
    const { ctx, app } = this;

    const { query } = ctx;

    const { questionnaire_id } = query;

    if (!questionnaire_id) {
      ctx.body = { success: false, msg: '此问卷不存在' };
    } else {
      if (ctx.body.status === -1) {
        const result = await app.mysql.query(
          `
          SELECT publisher.*,questionnaire.*,answer.*
          FROM publisher JOIN questionnaire JOIN answer
          ON publisher.questionnaire_id=questionnaire.questionnaire_id AND questionnaire.question_id=answer.question_id 
          WHERE answer.user_id=? AND questionnaire.questionnaire_id=?
        `,
          [user_id, questionnaire_id],
        );

        if (result.length == 0) {
          ctx.body = { success: false, msg: '问卷不存在' };
        } else {
          const data = ctx.helper.mergeQuestionnaireAnswer(result);

          // const { start_time, end_time } = data;
          // const status = ctx.helper.getQuestionnaireStatus(
          //   start_time,
          //   end_time,
          // );

          ctx.body = { success: true, data, status: -1 };
        }
      } else {
        const result = await app.mysql.query(
          `SELECT publisher.*,questionnaire.* FROM publisher JOIN questionnaire 
        ON publisher.questionnaire_id=questionnaire.questionnaire_id 
        WHERE publisher.questionnaire_id=?;`,
          [questionnaire_id],
        );

        if (result.length === 0) {
          ctx.body = { success: false, msg: '此问卷不存在' };
        } else {
          const data = ctx.helper.mergeQuestionnaireArr(result, {
            forStatistics: false,
          });

          const { start_time, end_time } = data;
          const status = ctx.helper.getQuestionnaireStatus(
            start_time,
            end_time,
          );

          ctx.body = { success: true, data, status };
        }
      }
    }
  }

  async fillQuestionnaire() {
    const { ctx, app } = this;
    const user_id = await ctx.service.account.getUserId();

    const {
      request: { body },
    } = ctx;

    const { questionnaire_id, answers = [] } = body;

    const insertAnswerArr = _.map(answers, ({ question_id, answer }) => {
      return {
        question_id,
        answer: _.isArray(answer) ? answer.join('|') : answer,
        user_id,
        commit_time: Date.now(),
        questionnaire_id,
      };
    });

    try {
      const result = await app.mysql.beginTransactionScope(async conn => {
        await conn.insert('answer', insertAnswerArr);
        const result = await conn.select('questionnaire', {
          where: {
            questionnaire_id,
          },
        });
        if (result) {
          const updateResult = ctx.helper.getUpdatedCount(
            insertAnswerArr,
            result,
          );

          const updateOptions = _.map(
            updateResult,
            ({ question_id, options_count }) => ({
              row: { options_count },
              where: {
                question_id,
              },
            }),
          );

          await conn.updateRows('questionnaire', updateOptions);
          await conn.query(
            `UPDATE publisher SET fill_count=fill_count+1 WHERE questionnaire_id=?`,
            [questionnaire_id],
          );
        }
      });

      ctx.body = { success: true, msg: '提交成功' };
    } catch (err) {
      app.logger.error(err);
      ctx.body = { success: false, msg: '提交失败，数据库错误' };
    }
  }
}
