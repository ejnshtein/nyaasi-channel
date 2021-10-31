import { RSSFile } from '@ejnshtein/nyaasi'
import { createEvent, restore } from 'effector'
import { UserFromGetMe } from 'typegram'

export const setPosts = createEvent<RSSFile[]>('set posts')

export const $posts = restore<RSSFile[]>(setPosts, [])

export const $postIds = $posts.map((posts) => posts.map((post) => post.id))

export const setBotUser = createEvent<UserFromGetMe>('set bot user')

export const $botUser = restore<UserFromGetMe>(setBotUser, null)

export const $botUsername = $botUser.map((user) => user && user.username)
