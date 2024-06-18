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
