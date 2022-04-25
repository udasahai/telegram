const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const Koa = require('koa')
// @ts-expect-error not a dependency of Telegraf
const koaBody = require('koa-body')
const safeCompare = require('safe-compare')
const { register, session, list, size } = require('./repo')

const token = '5373377602:AAFbnKSXv9QR1xrLqYeUZ8A-IRbN6snmRRg'
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// First reply will be served via webhook response,
// but messages order not guaranteed due to `koa` pipeline design.
// Details: https://github.com/telegraf/telegraf/issues/294
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.command('join', async (ctx) => await register(ctx))
bot.command('new_session', async (ctx) => await session(ctx))
bot.command('leave', (ctx) => ctx.reply('Participant Reigstered'))
bot.command('list', async (ctx) => await list(ctx))
bot.command('size', async (ctx) => await size(ctx))
bot.on('message', (ctx) => ctx.reply('Hello World'))

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
bot.telegram.setWebhook(`https://stale-rattlesnake-91.loca.lt${secretPath}`)

const app = new Koa()
app.use(koaBody())
// @ts-ignore
app.use(async (ctx, next) => {
  if (safeCompare(secretPath, ctx.url)) {
    await bot.handleUpdate(ctx.request.body)
    ctx.status = 200
    return
  }
  return next()
})
app.listen(3000)