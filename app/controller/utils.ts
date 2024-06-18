import { Controller } from 'egg'
import { createReadStream, createWriteStream } from 'fs'
import { nanoid } from 'nanoid'
import * as Busboy from 'busboy'
import { extname, join, parse, resolve } from 'path'
import * as sharp from 'sharp'
import sendToWormhole from 'stream-wormhole'
import { pipeline } from 'stream/promises'
import { createSSRApp } from 'vue'
import { renderToString, renderToNodeStream } from '@vue/server-renderer'
import { FileStream } from '../../typings/app'

export default class UtilsController extends Controller {
  splitIdAndUuid(str = '') {
    const result = { id: '', uuid: '' }
    if (!str) { return result }
    const firstDashIndex = str.indexOf('-')
    if (firstDashIndex < 0) { return result }
    result.id = str.slice(0, firstDashIndex)
    result.uuid = str.slice(firstDashIndex + 1)
    return result
  }
  async renderH5Page() {
    const { ctx, app } = this
    // const vueApp = createSSRApp({
    //   data: () => {
    //     return {
    //       msg: 'hello world'
    //     }
    //   },
    //   template: '<h1>{{msg}}</h1>'
    // })
    // // 使用 String 方式
    // // const appContent = await renderToString(vueApp)
    // // ctx.response.type = 'text/html'
    // // ctx.body = appContent
    // // 使用stream 方式
    // const stream = renderToNodeStream(vueApp)
    // ctx.state = 200
    // await pipeline(stream, ctx.res)

    // id-uuid
    const { idAndUuid } = ctx.params
    const query = this.splitIdAndUuid(idAndUuid)
    console.log(query)
    try {
      const pageData = await this.service.utils.rederToPageData(query)
      await ctx.render('page.nj', pageData)
    } catch (e) {
      console.log(e, 'error')
      ctx.helper.error({ ctx, errorType: 'h5WorkNotExistError' })
    }
  }

  async uploadToOSS() {
    const { ctx, app } = this
    const stream = await ctx.getFileStream()
    // lego-backend-tjrf/imooc-test/**.ext
    const savedOSSPath = join('imooc-test', nanoid(6) + extname(stream.filename))
    try {
      const result = await ctx.oss.put(savedOSSPath, stream)
      app.logger.info(result)
      const { name, url } = result
      ctx.helper.success({ ctx, res: { name, url } })
    } catch (e) {
      // 需要消费stream
      await sendToWormhole(stream)
      ctx.helper.error({ ctx, errorType: 'imageUploadFail' })
    }

  }

  // 多文件上传使用 busboy
  uploadFileUseBusBoy() {
    const { ctx, app } = this
    return new Promise<string[]>(async resolve => {
      const results: string[] = []
      const busboy = Busboy({ headers: ctx.req.headers })
      app.logger.info(busboy, 'busboy')
      busboy.on('file', (fieldname, file, fileInfo) => {
        app.logger.info(fieldname, file, fileInfo)
        const uid = nanoid(6)
        const savedFilePath = join(app.config.baseDir, 'uploads', uid + extname(fileInfo.filename))
        file.pipe(createWriteStream(savedFilePath))
        file.on('end', () => {
          results.push(savedFilePath)
        })
      })
      busboy.on('field', (fieldname, value) => {
        app.logger.info(fieldname, value)
      })
      busboy.on('finish', () => {
        app.logger.info('finished')
        resolve(results)
      })
      ctx.req.pipe(busboy)
    })
  }

  async uploadMutipleFiles() {
    const { ctx, app } = this
    const { fileSize } = app.config.multipart
    const parts = ctx.multipart({
      limits: { fileSize: fileSize as number }
    })
    // { urls: [xxx, xxx] }
    const urls: string[] = []
    let part: FileStream | string[]
    while ((part = await parts())) {
      if (Array.isArray(part)) {
        app.logger.info(part)
      } else {
        try {
          const savedOSSPath = join('imooc-test', nanoid(6) + extname(part.filename))
          const result = await ctx.oss.put(savedOSSPath, part)
          const { url } = result
          urls.push(url)
          // 文件达到设置大小上限
          if (part.truncated) {
            // 清除上传文件
            await ctx.oss.delete(savedOSSPath)
            return ctx.helper.error({ ctx, errorType: 'iamgeUploadFileSizeError', error: `Reach fileSize limt ${fileSize} bytes` })
          }
        } catch (e) {
          await sendToWormhole(part)
          ctx.helper.error({ ctx, errorType: 'imageUploadFail' })
        }
      }
    }
    ctx.helper.success({ ctx, res: { urls } })
  }

  async testBusBoy() {
    const { ctx, app } = this
    const results = await this.uploadFileUseBusBoy()
    app.logger.warn(results)
    ctx.helper.success({ ctx, res: results })
  }

  async fileLocalUpload() {
    const { ctx, app, service } = this
    const file = ctx.request.files[0]
    const { filepath } = file
    // 生成sharp实例
    const imageSource = sharp(filepath)
    const metaData = await imageSource.metadata()
    app.logger.debug(metaData)
    let thumbnailUrl = ''
    // 当图片的width > 300, 进行转化
    if (metaData.width && metaData.width > 300) {
      // generate a new file path
      // /uploads/**/abc.png -> /uploads/**/abc-thumbnail.png
      // name: abc, ext: .png dir: 不包括文件名
      const { name, ext, dir } = parse(filepath)
      const thumbnailFilePath = join(dir, `${name}-thumbnail${ext}`)
      // thumbnailUrl = thumbnailFilePath.replace(app.config.baseDir, app.config.baseUrl)
      thumbnailUrl = this.pathToURL(thumbnailFilePath)
      await imageSource.resize({ width: 300 }).toFile(thumbnailFilePath)
    }
    // const url = file.filepath.replace(app.config.baseDir, app.config.baseUrl)
    const url = this.pathToURL(file.filepath)
    ctx.helper.success({ ctx, res: { url, thumbnailUrl: thumbnailUrl ? thumbnailUrl : url } })
  }

  pathToURL(path: string) {
    const { app } = this
    return path.replace(app.config.baseDir, app.config.baseUrl)
  }

  async fileUploadByStream() {
    const { ctx, app } = this
    // 创建可读流
    const stream = await ctx.getFileStream()
    // uploads/**.ext
    // uploads/xxx_thumbnail.ext
    const uid = nanoid(6)
    // 配置文件生成路径
    const savedFilePath = join(app.config.baseDir, 'uploads', uid + extname(stream.filename))
    const savedThumbnailPath = join(app.config.baseDir, 'uploads', uid + '_thumbnail' + extname(stream.filename))
    // 创建可写流
    const target = createWriteStream(savedFilePath)
    const target2 = createWriteStream(savedThumbnailPath)
    const savePromise = pipeline(stream, target)
    const transformer = sharp().resize({ width: 300 })
    const thumbnailPromise = pipeline(stream, transformer, target2)
    try {
      await Promise.all([ savePromise, thumbnailPromise ])
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'imageUploadFail' })
    }
    ctx.helper.success({
      ctx,
      res: {
        url: this.pathToURL(savedFilePath),
        thumbnailUrl: this.pathToURL(savedThumbnailPath)
      }
    })
  }
}
