import { Context, EggAppConfig } from 'egg';
import { verify } from 'jsonwebtoken';

function getTokenValue(ctx: Context) {
  // JWT格式 Authorization tokenxxx
  const { authorization } = ctx.header
  if (!ctx.header && !authorization) {
    return false
  }
  if (typeof authorization === 'string') {
    const parts = authorization.trim().split(' ')
    if (parts.length === 2) {
      const scheme = parts[0]
      const credentials = parts[1]
      if (/^Bearer$/i.test(scheme)) {
        return credentials
      }
      return false
    }
  } else {
    return false
  }
}

export default (options: EggAppConfig['jwt']) => {
  return async (ctx: Context, next: () => Promise<any>) => {
    // 从header 获取 token
    const token = getTokenValue(ctx)
    if (!token) {
      return ctx.helper.error({ ctx, errorType: 'loginValidateFail' })
    }
    // 判断secret 是否存在
    const { secret } = options
    if (!secret) {
      throw new Error('Secret not provided')
    }
    try {
      const decoded = verify(token, secret)
      // 在中间件之间传递信息，使用ctx.state，避免直接在ctx上直接定义变量，污染命名空间
      ctx.state.user = decoded
      await next()
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'loginValidateFail' })
    }
  }
}
