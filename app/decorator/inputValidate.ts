// 创建工厂函数，传入 rules errorType
import { GlobalErrorType } from '../error'
import { Controller } from 'egg'
export default function validateInput(rules: any, errorType: GlobalErrorType) {
  return function(prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function(...args: any[]) {
      const that = this as Controller
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { ctx, app } = that
      const errors = app.validator.validate(rules, ctx.request.body)
      if (errors?.length) {
        return ctx.helper.error({ ctx, errorType, error: errors })
      }
      return originalMethod.apply(this, args)
    }
  }
}
