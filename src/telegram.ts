import { Telegram } from 'telegraf'
import { getEnv } from './lib/get-env'

export const telegram = new Telegram(getEnv('BOT_TOKEN'))
