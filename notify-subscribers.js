import { Telegram } from '@telegraf/core'
import collection from './database/index.js'
import env from './env.js'
import sleep from './lib/sleep.js'
import buttons from './lib/buttons.js'
import getXtFromMagnet from './lib/get-torrent-hash-from-magnet.js'
import HtmlEntities from 'html-entities'
import { templates } from './lib/templates.js'
const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()

const telegram = new Telegram(env.BOT_TOKEN)

export async function notifyUsers (torrent, skip = 0) {
  const subscriptions = await collection('subscriptions')
    .find({})
    .skip(skip)
    .limit(20)

  const result = await findValidRegex(subscriptions, torrent)

  if (!Array.isArray(result)) {
    return notifyUsers(torrent, skip + 20)
  }
}

async function findValidRegex (subscriptions, torrent) {
  for (const sub of subscriptions) {
    if (sub.conditions) {
      if (sub.conditions.name) {
        const test = new RegExp(sub.conditions.name.regex, sub.conditions.name.options)
        if (!test.test(torrent.name)) {
          continue
        }
      }
      if (typeof sub.conditions.submitter === 'string') {
        if (sub.conditions.submitter !== torrent.conditions ||
          (!sub.conditions.submitter && torrent.conditions.toLowerCase() !== 'anonymous')
        ) {
          continue
        }
      }
      if (typeof sub.conditions.trusted === 'boolean') {
        if (torrent.is_trusted !== sub.conditions.trusted) {
          continue
        }
      }
      if (typeof sub.conditions.remake === 'boolean') {
        if (torrent.is_remake !== sub.conditions.remake) {
          continue
        }
      }
    }
    return sendMessages(
      sub.users,
      formatMessage(torrent),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: buttons.torrent.download,
                callback_data: `d=${torrent.id}`
              },
              {
                text: buttons.torrent.magnet,
                url: `${env.MAGNET_REDIRECT_HOST}/${env.MAGNET_REDIRECT_PREFIX}/${getXtFromMagnet(torrent.magnet)}`
              },
              {
                text: buttons.share,
                switch_inline_query: `torrent:${torrent.id}`
              }
            ],
            // [
            //   {
            //     text: 'Unsubscribe',
            //     callback_data: `subscribe:id=${sub._id}&s=1&subscribed=1`
            //   }
            // ]
          ]
        }
      }
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
<b>Size:</b> ${(torrent.filesize / 1000000000).toFixed(3)} GiB
<b>Creation Date:</b>: ${templates.date(torrent.creation_date)}
<b>Hash</b>: ${torrent.hash_hex}
`
}

async function sendMessages (users = [], text, extra) {
  const messages = []
  for (const userId of users) {
    try {
      messages.push(await telegram.sendMessage(userId, text, extra))
    } catch (e) {
      console.log('error', e)
    }
    await sleep(500)
  }
  return messages
}
