import 'egg';
import { Connection, Model } from 'mongoose'
import { UserProps } from '../app/model/user';
import * as OSS from 'ali-oss'
import { Options } from 'ali-oss'
declare module 'egg' {
  // 自定义类型
  interface MongooseModels extends IModel {
    // User: Model<UserProps>
    [key: string]: Model<any>
  }

  interface Context {
    genHash(plainText: string): Promise<any>
    compare(plainText: string, hash: string): Promis<boolean>
    oss: OSS
  }

  interface EggAppConfig {
    bcrypt: {
      saltRounds: number
    },
    oss: {
      client?: Options
    }
  }

  interface Application {
    sessionMap: {
      [key: string]: any
    }
    sessionStore: any
  }
}