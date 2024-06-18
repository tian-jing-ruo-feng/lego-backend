import { Controller } from 'egg';
import validateInput from '../decorator/inputValidate';
// import { sign, verify } from 'jsonwebtoken';

// 规则参照 parameter 库定义
const useCreateRules = {
  username: 'email',
  password: { type: 'password', min: 8 }
}
const userPhoneCreateRules = {
  phoneNumber: { type: 'string', format: /^1[3-9]\d{9}$/, message: '手机格式错误' }
}
export const userErrorMessages = {
  userValidateFail: {
    errno: 101001,
    message: '输入信息验证失败'
  },
  createUserAlreadyExists: {
    errno: 101002,
    message: '该邮箱已经被注册，请直接登陆'
  },
  // 用户不存在或者密码错误
  loginCheckFailInfo: {
    errno: 101003,
    message: '该用户不存在或者密码错误'
  },
  // 登录验证失败
  loginValidateFail: {
    errno: 101004,
    message: '登录校验失败'
  },
  // 发送短信验证码过于频繁
  sendVeriCodeFrequentlyFailInfo: {
    errno: 101005,
    message: '请勿频繁获取短信验证码'
  },
  // 验证码不正确
  loginVeriCodeIncorrectFailInfo: {
    errno: 101006,
    message: '验证码不正确'
  },
  // 验证码发送失败
  sendVeriCodeError: {
    errno: 101007,
    message: '验证码发送失败'
  },
  // gitee 授权错误
  giteeOauthError: {
    errno: 101008,
    message: 'gitee 授权出错'
  }
}


export default class UserController extends Controller {
  @validateInput(useCreateRules, 'userValidateFail')
  async createByEmail() {
    const { ctx, service } = this
    const { username } = ctx.request.body
    const user = await service.user.findByUsername(username)
    if (user) {
      return ctx.helper.error({ ctx, errorType: 'createUserAlreadyExists' })
    }
    const userData = await service.user.createByEmail(ctx.request.body)
    ctx.helper.success({
      ctx,
      res: userData
    })
  }
  validateUserInput(rules: any) {
    const { ctx, app } = this
    // 参数验证
    // ctx.validate(useCreateRules)
    const errors = app.validator.validate(rules, ctx.request.body)
    ctx.logger.warn(errors)
    return errors
  }
  @validateInput(userPhoneCreateRules, 'userValidateFail')
  async sendVeriCode() {
    const { ctx, app } = this
    const { phoneNumber } = ctx.request.body
    // 获取redis 的数据
    // phoneVeriCode-13322221111
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`)
    // 判断值是否存在
    if (preVeriCode) {
      return ctx.helper.error({ ctx, errorType: 'sendVeriCodeFrequentlyFailInfo' })
    }
    // 模拟验证码
    // [1000, 10000)
    const veriCode = (Math.floor((Math.random() * 9000)) + 1000).toString()
    await app.redis.set(`phoneVeriCode-${phoneNumber}`, veriCode, 'ex', 60)
    ctx.helper.success({ ctx, res: { veriCode } })
  }
  @validateInput(useCreateRules, 'userValidateFail')
  async loginByEmail() {
    const { ctx, service, app } = this
    // 根据 username 取的用户信息
    const { username, password } = ctx.request.body
    const user = await service.user.findByUsername(username)
    // 检查用户是否存在
    if (!user) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' })
    }
    const verifyPwd = await ctx.compare(password, user.password)
    // 验证密码是否成功
    if (!verifyPwd) {
      return ctx.helper.error({ ctx, errorType: 'loginCheckFailInfo' })
    }
    // cookie 加密
    // ctx.cookies.set('username', user.username, { encrypt: true })
    // ctx.session.username = user.username
    // token
    // Registered claims 注册相关的信息
    // Public claims 公共信息：should be unique like email, address, or phone_number
    const token = app.jwt.sign({ username: user.username }, this.app.config.jwt.secret, { expiresIn: 60 * 60 })
    ctx.helper.success({ ctx, res: { token }, msg: '登录成功' })
  }

  async loginByCellphone() {
    const { ctx, app } = this
    const { phoneNumber, veriCode } = ctx.request.body
    // 检查用户输入
    const error = this.validateUserInput(userPhoneCreateRules)
    if (error) {
      ctx.helper.error({ ctx, errorType: 'loginValidateFail', error })
    }
    // 验证码是否输入正确
    const preVeriCode = await app.redis.get(`phoneVeriCode-${phoneNumber}`)
    if (veriCode !== preVeriCode) {
      return ctx.helper.error({ ctx, errorType: 'loginVeriCodeIncorrectFailInfo' })
    }
    const token = await ctx.service.user.loginByCellphone(phoneNumber)
    ctx.helper.success({ ctx, res: { token } })
  }
  async oauth() {
    const { ctx, app } = this
    const { cid, redirectURL } = app.config.giteeOauthConfig
    const url = `https://gitee.com/oauth/authorize?client_id=${cid}&redirect_uri=${redirectURL}&response_type=code`
    ctx.redirect(url)
  }
  async oauthByGitee() {
    const { ctx } = this
    const { code } = ctx.request.query
    try {
      const token = await ctx.service.user.loginByGitee(code)
      if (token) {
        ctx.helper.success({ ctx, res: { token } })
      }
    } catch (e) {
      ctx.helper.error({ ctx, errorType: 'giteeOauthError' })
    }
  }
  async show() {
    const { ctx, service, app } = this
    // /users/:id
    // cookie 解密
    // const { username } = ctx.session
    // const username = ctx.cookies.get('username', { encrypt: true })

    // const userData = await service.user.findById(ctx.params.id)
    // const token = this.getTokenValue()
    // if (!token) {
    //   return ctx.helper.error({ ctx, errorType: 'loginValidateFail' })
    // }
    // try {
    //   const decoded = verify(token, app.config.secret)
    //   ctx.helper.success({ ctx, res: decoded })
    // } catch (e) {
    //   return ctx.helper.error({ ctx, errorType: 'loginValidateFail' })
    // }
    const userData = await service.user.findByUsername(ctx.state.user.username)
    ctx.helper.success({ ctx, res: userData?.toJSON() })

  }
}
