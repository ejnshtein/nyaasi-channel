import { NyaaRss } from '@ejnshtein/nyaasi'
import { getEnv } from './lib/get-env'

export const rss = new NyaaRss({
  host: `https://${getEnv('REAL_HOST')}/`
})
