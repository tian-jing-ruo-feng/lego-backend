import { Service } from 'egg'
import { nanoid } from 'nanoid'
import { WorkProps } from '../model/work';
import { IndexCondition } from '../controller/work';

const defaultIndexCondition: Required<IndexCondition> = {
  pageIndex: 0,
  pageSize: 0,
  select: '',
  populate: '',
  customSort: { createdAt: -1 },
  find: {}
}

export default class WorkService extends Service {
  async createEmptyWork(payload) {
    const { ctx } = this
    // 获取对应的user id
    const { username, _id } = ctx.state.user
    // 获取一个独一无二的 URL ID
    const uuid = nanoid(6)
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      // user: new Types.ObjectId(_id),
      user: _id,
      author: username,
      uuid
    }
    return ctx.model.Work.create(newEmptyWork)
  }

  async getList(condition: IndexCondition) {
    const fcondition = { ...defaultIndexCondition, ...condition }
    const { pageIndex, pageSize, select, populate, customSort, find } = fcondition
    const skip = pageIndex * pageSize
    const res = await this.ctx.model.Work
      .find(find)
      .select(select)
      // populate 参数 类型错误 使用any断言
      .populate(populate as any)
      .skip(skip)
      .limit(pageSize)
      .sort(customSort)
      .lean()
    const count = await this.ctx.model.Work.find(find).count()
    return { count, list: res, pageSize, pageIndex }
  }

  async publish(id: number, isTemplate = false) {
    const { ctx } = this
    const { H5BaseURL } = ctx.app.config
    const payload: Partial<WorkProps> = {
      status: 2,
      latestPublishAt: new Date(),
      ...(isTemplate && { isTemplate: true })
    }

    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, { new: true })
    const { uuid } = res as WorkProps
    return `${H5BaseURL}/p/${id}-${uuid}`
  }
}
