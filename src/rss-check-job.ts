import { sleep } from './lib/sleep'
import { rss } from './rss'
import { sendMessageToChannel } from './send-message'
import { $postIds, setPosts } from './store'

export async function checkingJob() {
  const newFeed = await rss.getHome()
  const oldPostIds = $postIds.getState()
  const newPosts = newFeed.filter((el) => !oldPostIds.includes(el.id)).reverse()

  if (newPosts.length === 0) {
    return
  }

  setPosts(newFeed)

  for (const post of newPosts) {
    await sleep(1500)
    await sendMessageToChannel(post)
  }
}
