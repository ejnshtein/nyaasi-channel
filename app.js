import env from './env.js'

import NodeSchedule from 'node-schedule'
import HtmlEntities from 'html-entities'
import { Telegram } from '@telegraf/core'

import RssParser from 'rss-parser'
import buttons from './lib/buttons.js'
import buffer from './lib/buffer.js'
import sleep from './lib/sleep.js'

const { AllHtmlEntities } = HtmlEntities
const { scheduleJob } = NodeSchedule
const { decode } = new AllHtmlEntities()
const parser = new RssParser({
  customFields: {
    item: [
      'nyaa:seeders',
      'nyaa:leechers',
      'nyaa:downloads',
      'nyaa:infoHash',
      'nyaa:categoryId',
      'nyaa:category',
      'nyaa:size',
      'nyaa:trusted',
      'nyaa:remake',
      'description',
      'guid'
    ]
  }
})

const telegram = new Telegram(env.BOT_TOKEN)

const feed = {
  items: [],
  feedUrl: `https://${env.HOST}/?page=rss`,
  title: `${env.WEBSITE_NAME} - Home - Torrent File RSS`,
  description: 'RSS Feed for Home',
  link: `https://${env.HOST}/`
}

loadFeed()
  .then(data => {
    feed.items = data.items.map(el => el.id)
  })

async function loadFeed () {
  const data = await parser.parseURL(`https://${env.HOST}/?page=rss`)
  data.items.forEach(el => {
    el.id = Number.parseInt(el.guid.split('/').pop())
  })
  return data
}

scheduleJob('*/1 * * * *', async () => {
  const newFeed = await loadFeed()
  const newPosts = newFeed.items.filter(el => !feed.items.includes(el.id)).reverse()
  feed.items = newFeed.items.map(el => el.id)
  if (newPosts.length) {
    for (const post of newPosts) {
      await sendMessage(post)
      await sleep(1500)
    }
  }
})

async function sendMessage (post) {
  let messageText = `<b>${decode(post.title)
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`
  messageText += `${post['nyaa:size']} | <a href="${post.link}">Download</a> | <a href="${post.guid}">View</a>`
  if (post['nyaa:trusted'] === 'Yes') {
    messageText += ' | #trusted'
  }
  if (post['nyaa:remake'] === 'Yes') {
    messageText += ' | #remake'
  }
  messageText += `\n#c${post['nyaa:categoryId']} <a href="https://${env.HOST}/?c=${post['nyaa:categoryId']}">${post['nyaa:category']}</a>`

  await telegram.sendMessage(env.CHANNEL_ID, messageText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: buttons.torrent.magnet,
            url: `${env.MAGNET_REDIRECT_HOST}/${env.MAGNET_REDIRECT_PREFIX}/urn:btih:${post['nyaa:infoHash']}`
          },
          {
            text: 'Torrent info',
            url: `https://t.me/${env.BOT_USERNAME}?start=${buffer.encode(`view:${post.id}`)}`
          }
        ]
      ]
    },
    disable_web_page_preview: true
  })
}
