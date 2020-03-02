const crypto = require('crypto');
const moment = require('moment');
const _ = require('lodash');

const SECRET_KEY = 'QUESTIONNAIRE_SYSTEM_2020';

const STATUS = {
  NOT_START: 0,
  IN_PROGRESS: 1,
  OUT_OF_DATE: 2,
};

function md5(content) {
  let md5 = crypto.createHash('md5');
  return md5.update(content).digest('hex');
}

function genPassword(password) {
  const str = JSON.stringify({ password, key: SECRET_KEY });

  return md5(str);
}

module.exports = {
  genPassword,
  getQuestionnaireStatus(startTime, endTime) {
    const mStartTime = moment(startTime);
    const mEndTime = moment(endTime);

    const now = moment();

    if (now.isBefore(mStartTime)) {
      return STATUS.NOT_START;
    } else if (now.isBetween(mStartTime, mEndTime)) {
      return STATUS.IN_PROGRESS;
    } else {
      return STATUS.OUT_OF_DATE;
    }
  },
  mergeQuestionnaireArr(questionnaireArr, options = {}) {
    const commonKeys = [
      'questionnaire_id',
      'user_id',
      'questionnaire_name',
      'start_time',
      'end_time',
      'status',
      'fill_count',
    ];

    const questionnaireInfoKeys = commonKeys;

    const { forStatistics = true } = options;

    const result = _.assign(
      _.pick(questionnaireArr[0], questionnaireInfoKeys),
      { questions: [] },
    );

    for (const questionnaire of questionnaireArr) {
      let question = _.omit(questionnaire, questionnaireInfoKeys);

      question.options = question.options.split('|');
      question.options_count = question.options_count.split('|');
      question.options_with_count = [];

      if (forStatistics) {
        // 用于后台统计
        const { options, options_count, options_with_count } = question;
        for (let i = 0; i < options.length; i++) {
          options_with_count.push({
            option: options[i],
            count: options_count[i],
          });
        }

        result.questions.push(_.omit(question, ['options', 'options_count']));
      } else {
        // 用于填问卷页面展示
        result.questions.push(
          _.omit(question, ['options_count', 'options_with_count']),
        );
      }
    }

    return result;
  },

  mergeQuestionnaireAnswer(queryResult) {
    const commonKeys = [
      'questionnaire_id',
      'user_id',
      'commit_time',
      'questionnaire_name',
      'start_time',
      'end_time',
      'status',
      'fill_count',
    ];

    const result = _.assign(_.pick(queryResult[0], commonKeys), {
      questions: [],
    });

    for (let item of queryResult) {
      const question = _.omit(item, commonKeys);
      question.options = question.options.split('|');
      if (question.question_type === 1) {
        question.answer = question.answer.split('|');
      }

      result.questions.push(_.omit(question, ['options_count']));
    }

    return result;
  },

  getUpdatedCount(answerArr, questionArr) {
    const result = [];
    for (const item of answerArr) {
      const { question_id, answer } = item;
      const target = questionArr.find(
        item => Number(item.question_id) == Number(question_id),
      );
      if (target) {
        const { question_type } = target;
        // let { options, options_count } = target;
        const options = target.options.split('|');
        const options_count = target.options_count.split('|');
        for (let i = 0; i < options.length; i++) {
          if (question_type === 0) {
            if (options[i] == answer) {
              options_count[i] = Number(options_count[i]) + 1;
            }
          } else if (question_type === 1) {
            const answerArr = answer.split('|');
            if (answerArr.includes(options[i])) {
              options_count[i] = Number(options_count[i]) + 1;
            }
          }
        }
        result.push({ question_id, options_count: options_count.join('|') });
      }
    }
    return result;
  },
};
/** 
 * 
    questionnaire_id: 6,
    user_id: 1,
    commit_time: 1583064510426
    questionnaire_name: '武汉大学生调查问卷2',
    start_time: 1582914046620,
    end_time: 1593543127021,
    status: 1,
    fill_count: 0,

    question_id: 3,
    question_name: '你就读于哪所大学',
    question_type: 0,
    options: '武汉大学|华中科技大学|北京大学',
    option_max_num: 1,
    options_count: '0|0|0',
    answer_id: 1,
    answer: '武汉大学',
    
    
    
 */
