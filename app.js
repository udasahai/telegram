const { Telegraf } = require('telegraf')
// @ts-expect-error not a dependency of Telegraf
const Koa = require('koa')
// @ts-expect-error not a dependency of Telegraf
const koaBody = require('koa-body')
const safeCompare = require('safe-compare')
const { join, session, list, size, addPlayerIfNew, leave } = require('./repo')

const token = '5373377602:AAFbnKSXv9QR1xrLqYeUZ8A-IRbN6snmRRg'
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// First reply will be served via webhook response,
// but messages order not guaranteed due to `koa` pipeline design.
// Details: https://github.com/telegraf/telegraf/issues/294
bot.command('start', (ctx) => ctx.reply('Hello I the BadmintonBot. Please use the command menu to give me a command.'))
bot.use( async (ctx, next) => {await addPlayerIfNew(ctx); next();});
bot.command('image', (ctx) => ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' }))
bot.command('join', async (ctx) => await join(ctx))
bot.command('new_session', async (ctx) => await session(ctx))
// bot.command('end_session', async (ctx) => await end_session(ctx))
bot.command('leave', async (ctx) => await leave(ctx))
bot.command('list', async (ctx) => await list(ctx))
bot.command('size', async (ctx) => await size(ctx))
bot.command('help', (ctx) => ctx.reply('Hello I the BadmintonBot. Please use the command menu to give me a command.'))
bot.on('message', (ctx) => ctx.reply('Please input a valid command. No need to tag the bot. Commands are of the form - /command.'))
bot.use( async (ctx) => ctx.reply('This is not a valid input.'));

const node_env = process.env.NODE_ENV;
let url = 'spicy-chicken-59.loca.lt'
if(node_env == 'prod'){
  url = 'udayansahai.com'
} 

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
console.log(`Using url - ${url}`);
bot.telegram.setWebhook(`https://${url}${secretPath}`)

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