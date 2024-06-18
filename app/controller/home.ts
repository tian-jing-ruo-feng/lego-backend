import { Controller } from 'egg';
import { version as appVersion } from '../../package.json'

export default class HomeController extends Controller {
  public async index() {
    const { ctx } = this;
    const { status } = ctx.app.redis
    // const { version } = ctx.app.mongoose
    const { version } = await ctx.app.mongoose.connection.db.command({ buildInfo: 1 })
    ctx.helper.succss({
      ctx,
      res: {
        dbVersion: version,
        redisStatus: status,
        appVersion,
        env: process.env.PING_ENV
      }
    })
    ctx.body = await ctx.service.test.sayHi('egg');
  }
}
