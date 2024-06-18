import { Service } from 'egg';
import { UserProps } from '../model/user';

interface GiteeUserResp {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}
export default class UserService extends Service {
  public async createByEmail(payload: UserProps) {
    const { ctx } = this
    const { username, password } = payload
    const hash = await ctx.genHash(password)
    const userCreatedData: Partial<UserProps> = {
      username,
      password: hash,
      email: username
    }
    return ctx.model.User.create(userCreatedData)
  }

  async findById(id: string) {
    const result = await this.ctx.model.User.findById(id)
    if (result) {
      result.username
    }
    return this.ctx.model.User.findById(id)
  }

  async findByUsername(username: string) {
    return this.ctx.model.User.findOne({ username })
  }

  async loginByCellphone(cellphone: string) {
    const { ctx, app } = this
    const user = await this.findByUsername(cellphone)
    // 检查用户是否存在
    if (user) {
      // generate token
      const token = app.jwt.sign({ username: cellphone, _id: user._id }, app.config.jwt.secret, { expiresIn: app.config.jwtExpires })
      return token
    }
    // 创建用户 & generate token
    const userCreateData: Partial<UserProps> = {
      username: cellphone,
      phoneNumber: cellphone,
      nickName: `乐高${cellphone.slice(-4)}`,
      type: 'cellphone'
    }
    const newUser = await ctx.model.User.create(userCreateData)
    const token = app.jwt.sign({ username: newUser.username, _id: newUser._id }, app.config.jwt.secret, { expiresIn: app.config.jwtExpires })
    return token
  }

  async getAccessToken(code: string) {
    const { ctx, app } = this
    const { cid, secret, redirectURL, authURL } = app.config.giteeOauthConfig
    const { data } = await ctx.curl(authURL, {
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: {
        code,
        client_id: cid,
        redirect_uri: redirectURL,
        client_secret: secret
      }
    })
    app.logger.info(data)
    return data.access_token
  }

  // get gitee user data
  async getGiteeUserData(access_token: string) {
    const { ctx, app } = this
    const { giteeUserAPI } = app.config.giteeOauthConfig
    const { data } = await ctx.curl<GiteeUserResp>(`${giteeUserAPI}?access_token=${access_token}`, { method: 'GET', dataType: 'json' })
    return data
  }

  async loginByGitee(code: string) {
    const { ctx, app } = this
    // 获取access_token
    const access_token = await this.getAccessToken(code)
    // 获取用户信息
    const user = await this.getGiteeUserData(access_token)
    // 检查用户是否存在
    const { id, name, avatar_url, email } = user
    const stringID = id.toString()
    //  Gitee + id / Github + id / WX + id
    // 用户已经存在
    const username = `Gitee${stringID}`
    const existUser = await this.findByUsername(username)
    if (existUser) {
      const token = app.jwt.sign({ username: existUser.username, _id: existUser._id }, app.config.jwt.secret, { expiresIn: app.config.jwtExpires })
      return token
    }
    // 用户不存在，新建用户，并生成token 返回
    const userCreateData: Partial<UserProps> = {
      oauthId: stringID,
      provider: 'gitee',
      username,
      picture: avatar_url,
      nickName: name,
      email,
      type: 'oauth'
    }
    const newUser = await ctx.model.User.create(userCreateData)
    const token = app.jwt.sign({ username: newUser.username, _id: newUser._id }, app.config.jwt.secret, { expiresIn: app.config.jwtExpires })
    return token
  }
}
