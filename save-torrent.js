import { Nyaa } from '@ejnshtein/nyaasi'
import env from './env.js'
import fs from 'fs'
import { notifyUsers } from './notify-subscribers.js'
import exitHook from 'async-exit-hook'

const nyaa = new Nyaa()
if (fs.existsSync('./mysession')) {
  nyaa.agent.loginWithSession('./mysession')
} else {
  nyaa.agent.login(env.NYAA_USERNAME, env.NYAA_PASSWORD)
    .then(() => {
      nyaa.agent.saveSession('./mysession')
    })
}

exitHook(callback => {
  nyaa.agent.saveSession('./mysession')
    .then(() => callback())
})

export async function saveTorrent (torrentId) {
  const torrent = await nyaa.getTorrent(torrentId)

  function transformFiles ([name, size]) {
    if (typeof size === 'object') {
      return {
        name,
        files: Object.entries(size).map(transformFiles)
      }
    } else {
      return {
        name,
        size
      }
    }
  }
  torrent.files = Object.entries(torrent.files).map(transformFiles)
  // await collection('torrents').findOneAndUpdate(
  //   { id: torrent.id },
  //   { $set: torrent },
  //   { new: true, upsert: true }
  // )
  return notifyUsers(torrent)
}
