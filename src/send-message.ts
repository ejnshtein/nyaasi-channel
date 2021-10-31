import { RSSFile } from '@ejnshtein/nyaasi'
import { decode as decodeText } from 'html-entities'
import { encodeBuffer } from './lib/buffer'
import { torrentButton } from './lib/buttons'
import { getEnv } from './lib/get-env'
import { $botUsername } from './store'
import { telegram } from './telegram'

const magnetHtmlLink = (post: RSSFile) =>
  `<a href="https://${getEnv('MAGNET_REDIRECT_HOST')}/${getEnv(
    'MAGNET_REDIRECT_PREFIX'
  )}/urn:btih:${post.infoHash}">${torrentButton.magnet}</a>`

const infoHtmlLink = (post: RSSFile) =>
  `<a href="https://t.me/${$botUsername.getState()}?start=${encodeBuffer(
    `view:${post.id}`
  )}">Info</a>`

export async function sendMessageToChannel(post: RSSFile): Promise<void> {
  let messageText = `<b>${decodeText(post.title)
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`

  const link = `https://${getEnv('HOST')}/download/${post.id}.torrent`

  messageText += `${
    post.size
  } | <a href="${link}">Download</a> | <a href="https://${getEnv(
    'HOST'
  )}/view/${post.id}">View</a>`
  if (post.trusted === 'Yes') {
    messageText += ' | #trusted'
  }
  if (post['nyaa:remake'] === 'Yes') {
    messageText += ' | #remake'
  }
  messageText += `\n#c${post.categoryId} <a href="https://${getEnv(
    'HOST'
  )}/?c=${post.categoryId}">${post.category}</a>`

  messageText += `\n\n`

  messageText += `${magnetHtmlLink(post)} | ${infoHtmlLink(post)}`

  await telegram.sendMessage(getEnv('CHANNEL_ID'), messageText, {
    parse_mode: 'HTML',
    disable_web_page_preview: true
  })
}
