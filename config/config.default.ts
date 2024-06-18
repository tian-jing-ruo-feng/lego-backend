import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { join } from 'path';
import * as dotenv from 'dotenv'
import { dir } from 'console';
dotenv.config()

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1631677352881_6029';

  // add your egg config in here
  // config.middleware = [ 'customError' ];

  config.security = {
    csrf: {
      enable: false
    },
    domainWhiteList: [
      'http://localhost:8080'
    ]
  }
  config.view = {
    defaultViewEngine: 'nunjucks'
  }
  config.logger = {
    consoleLevel: 'DEBUG'
  }
  config.mongoose = {
    url: 'mongodb://localhost:27017/lego',
    options: {
      // user: 'tjrf',
      // pass: '123456',
      user: 'root',
      pass: '123456',
      authSource: 'admin' // 用户来源
    }
  }
  config.bcrypt = {
    saltRounds: 10
  }
  config.session = {
    encrypt: false
  }
  config.jwt = {
    enable: true,
    secret: process.env.JWT_SECRET || '',
    match: [ '/api/users/getUserInfo', '/api/works', '/api/utils/upload-img', '/api/channel' ]
  }
  config.redis = {
    client: {
      port: 6379,
      host: '127.0.0.1',
      password: '',
      db: 0
    }
  }
  // 默认为 stream 模式
  // config.multipart = {
  //   mode: 'file',
  //   tmpdir: join(appInfo.baseDir, 'uploads')
  // }
  config.multipart = {
    // 设置文件上传格式白名单
    whitelist: [ '.png', '.jpg', '.gif', '.webp' ],
    fileSize: '100kb'
  }
  // 静态文件路由映射
  config.static = {
    dir: [
      { prefix: '/public', dir: join(appInfo.baseDir, 'app/public') },
      { prefix: '/uploads', dir: join(appInfo.baseDir, 'uploads') }
    ]
  }
  config.oss = {
    client: {
      accessKeyId: process.env.ALC_ACCESS_KEY || '',
      accessKeySecret: process.env.ALC_ACCESS_SECTET || '',
      bucket: 'lego-backend-tjrf',
      endpoint: 'oss-cn-shanghai.aliyuncs.com'
    }
  }
  // config.mongoose = {
  //   client: {
  //     url: 'mongodb://localhost:27017/lego',
  //     options: {},
  //     plugins: []
  //   }
  // }

  // add your special config in here
  // gitee oauth config
  const giteeOauthConfig = {
    cid: process.env.GITEE_CID,
    secret: process.env.GITEE_SECRET,
    redirectURL: 'http://localhost:7002/api/users/passport/gitee/callback',
    authURL: 'https://gitee.com/oauth/token?grant_type=authorization_code',
    giteeUserAPI: 'https://gitee.com/api/v5/user'
  }
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    myLogger: {
      allowedMethod: [ 'POST' ]
    },
    baseUrl: 'default.url',
    giteeOauthConfig,
    H5BaseURL: 'http://localhost:7001/api/pages'
  };

  // the return config will combines to EggAppConfig
  return {
    ...config as {},
    ...bizConfig,
    // jwt: {
    //   secret: 'abcdefghigklmnopqrstuvwxyz0123456789@_.'
    // }
  };
};
