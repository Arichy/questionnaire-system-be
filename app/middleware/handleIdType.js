import _ from 'lodash';

export default options => async (ctx, next) => {
  const { query } = ctx;
  const keys = _.keys(query).filter(key => _.endsWith(key, 'id'));
  for (const key of keys) {
    ctx.query[key] = _.toNumber(ctx.query[key]);
  }

  await next();
};
