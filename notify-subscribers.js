import { Telegram } from '@telegraf/core'
import collection from './database/index.js'
import env from './env.js'
import sleep from './lib/sleep.js'
import buttons from './lib/buttons.js'
import getXtFromMagnet from './lib/get-torrent-hash-from-magnet.js'
import HtmlEntities from 'html-entities'
import { templates } from './lib/templates.js'
import buffer from './lib/buffer.js'
const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()

const telegram = new Telegram(env.BOT_TOKEN)

export async function notifyUsers (torrent, skip = 0) {
  const subscriptions = await collection('subscriptions')
    .find({})
    .skip(skip)
    .limit(50)

  await findValidRegex(subscriptions, torrent)

  if (subscriptions.length === 50) {
    return notifyUsers(torrent, skip + 50)
  }
}

async function findValidRegex (subscriptions, torrent) {
  for (const { chats, conditions } of subscriptions) {
    if (!chats || chats.length === 0) {
      continue
    }
    if (conditions) {
      if (typeof conditions.name === 'object') {
        const { options, regex, input } = conditions.name
        if (input) {
          if (!torrent.name.includes(input)) {
            continue
          }
        } else if (regex) {
          const test = new RegExp(regex, options || 'i')
          if (!test.test(torrent.name)) {
            continue
          }
        }
      }
      if (typeof conditions.submitter === 'string') { // use 'any' for anonymous
        if (!torrent.submitter || conditions.submitter.trim() !== torrent.submitter) {
          continue
        }
      }
      if (typeof conditions.trusted === 'boolean') {
        if (torrent.is_trusted !== conditions.trusted) {
          continue
        }
      }
      if (typeof conditions.remake === 'boolean') {
        if (torrent.is_remake !== conditions.remake) {
          continue
        }
      }
    }
    await sendMessages(
      torrent,
      chats
    )
  }
}

function formatMessage (torrent) {
  return `
New torrent just arrived!

<a href="https://${env.HOST}/view/${torrent.id}">${decode(torrent.name)
.replace(/</gi, '&lt;')
.replace(/>/gi, '&gt;')
.replace(/&/gi, '&amp;')}</a>
<b>Submitter:</b> ${torrent.submitter !== 'Anonymous' ? `<a href="https://${env.HOST}/user/${torrent.submitter}">${torrent.submitter}</a>` : torrent.submitter}
<b>Size:</b> ${(torrent.filesize / 1000000000).toFixed(2)} GiB
<b>Creation Date:</b> ${torrent.creation_date}
<b>Hash</b>: <code>${torrent.hash_hex}</code>
`
}

function formatPublicMessage (torrent) {
  let messageText = `<b>${decode(torrent.name)
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`
  messageText += `${(torrent.filesize / 1000000000).toFixed(2)} GiB | <a href="https://${env.HOST}/download/${torrent.id}.torrent">Download</a> | <a href="${torrent.url}">View</a>`
  if (torrent.is_trusted) {
    messageText += ' | #trusted'
  }
  if (torrent.is_remake) {
    messageText += ' | #remake'
  }
  messageText += `\n#c${torrent.main_category_id}_${torrent.sub_category_id} <a href="https://${env.HOST}/?c=${torrent.main_category_id}_${torrent.sub_category_id}">${torrent.main_category}-${torrent.sub_category}</a>`

  return messageText
}

async function sendMessages (torrent, chats = []) {
  const messages = []
  for (const chatId of chats) {
    const keyboard = [
      {
        text: buttons.torrent.magnet,
        url: `${env.MAGNET_REDIRECT_HOST}/${env.MAGNET_REDIRECT_PREFIX}/${getXtFromMagnet(torrent.magnet)}`
      }
    ]
    if (chatId > 0) {
      keyboard.push(
        {
          text: buttons.share,
          switch_inline_query: `torrent:${torrent.id}`
        }
      )
      keyboard.unshift(
        {
          text: buttons.torrent.download,
          callback_data: `d=${torrent.id}`
        }
      )
    } else {
      keyboard.unshift(
        {
          text: buttons.torrent.download,
          url: `https://t.me/${env.BOT_USERNAME}?start=${buffer.encode(`download:${torrent.id}`)}`
        }
      )
      keyboard.push(
        {
          text: 'Info',
          url: `https://t.me/${env.BOT_USERNAME}?start=${buffer.encode(`view:${torrent.id}`)}`
        }
      )
    }
    const text = chatId > 0 ? formatMessage(torrent) : formatPublicMessage(torrent)
    const extra = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [keyboard]
      }
    }
    if (chatId < 0) {
      extra.disable_web_page_preview = true
    }
    try {
      messages.push(
        await telegram.sendMessage(chatId, text, extra)
      )
    } catch (e) {
      console.log('error', e)
    }
    await sleep(500)
  }
  return messages
}
