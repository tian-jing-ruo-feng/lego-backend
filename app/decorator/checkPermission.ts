import { subject } from '@casl/ability'
import { permittedFieldsOf } from '@casl/ability/extra'
import { GlobalErrorType } from '../error'
import defineRoles from '../roles/roles'
import { Controller } from 'egg'
import { difference, assign } from 'lodash/fp'

const caslMethodMapping: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  DELETE: 'delete'
}
interface ModelMapping {
  mongoose: string;
  casl: string
}
interface IOptions {
  // 自定义action
  action?: string;
  // 查找记录时的key, 默认为id
  key?: string;
  // 查找记录时的 value 的来源，默认为 ctx.params
  // 来源对应的 url 参数 或者 ctx.request.body, valueKey 数据来源的键值
  value?: { type: 'params' | 'body', valueKey: string }
}
const fieldsOptions = { fieldsFrom: rule => rule.fields || [] }
const defaultSearchOptions = {
  key: 'id',
  value: { type: 'params', valueKey: 'id' }
}

// { id: ctx.params.id }
// { 'channels.id': ctx.params.id }
// { 'channels.id': ctx.request.body.workID }
/**
 *
 * @param modelName model的名称，可以是普通的字符串，也可以是 casl 和 mongoose 的映射关系
 * @param errorType 返回的错误类型，来自于 GlobalErrorType
 * @param options 特殊配置选项，可以自定义action 以及 查询条件，详见上边的IOptions
 * @return function
 */
export default function checkPermission(modelName: string | ModelMapping, errorType: GlobalErrorType, options?: IOptions) {
  return function(prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function(...args: any[]) {
      const that = this as Controller
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { ctx } = that
      const { id } = ctx.params
      const { method } = ctx.request
      const searchOptions = assign(defaultSearchOptions, options || {})
      const { key, value } = searchOptions
      const { type, valueKey } = value

      // 构建query
      const source = (type === 'params') ? ctx.params : ctx.request.body
      const query = {
        [key]: source[valueKey]
      }
      // 构建modelName
      const mongooseModelName = typeof modelName === 'string' ? modelName : modelName.mongoose
      const caslModelName = typeof modelName === 'string' ? modelName : modelName.casl
      const action = (options && options.action) ? options.action : caslMethodMapping[method]
      if (!ctx.state && !ctx.state.user) {
        return ctx.helper.error({ ctx, errorType })
      }
      let permisson = false
      let keyPermission = true
      // 获取定义的 roles
      const ability = defineRoles(ctx.state.user)
      const rule = ability.relevantRuleFor(action, caslModelName)
      // console.log(rule, 'rule')
      // 所以我们需要获取 rule 来判断一下，看他是否存在对应的条件
      if (rule && rule.conditions) {
        // 加入存在 condition，先查询对应的数据
        const certainRecord = await ctx.model[mongooseModelName].findOne(query).lean()
        permisson = ability.can(action, subject(caslModelName, certainRecord))
      } else {
        permisson = ability.can(action, caslModelName)
      }
      // 判断rule中是否有对应的受限字段
      if (rule && rule.fields) {
        const fields = permittedFieldsOf(ability, action, caslModelName, fieldsOptions)
        if (fields.length > 0) {
          // 1. 过滤request.body *
          // 2. 获取当前的 payload 的 keys 和 允许的 fields 做比较
          // fields对payloadKeys 应该是全部包含的关系
          const payloadKeys = Object.keys(ctx.request.body)
          const diffKeys = difference(payloadKeys, fields)
          // console.log(diffKeys, 'diffKeys')
          keyPermission = diffKeys.length === 0
        }
      }

      // const userId = ctx.state.user._id
      // const certainRecord = await ctx.model[modelName].findOne({ id })
      // if (!certainRecord || certainRecord[userKey].toString !== userId) {
      //   return ctx.helper.error({ ctx, errorType })
      // }
      // console.log(permisson, 'permisson')
      // console.log(keyPermission, 'keyPermission')
      if (!permisson || !keyPermission) {
        return ctx.helper.error({ ctx, errorType })
      }
      await originalMethod.apply(this, args)
    }
  }
}
