export interface DefinedProcessEnv {
  BOT_TOKEN: string
  HOST: string
  REAL_HOST: string
  WEBSITE_NAME: string
  CHANNEL_ID: string
  MAGNET_REDIRECT_HOST: string
  MAGNET_REDIRECT_PREFIX: string
}

export const getEnv = (name: keyof DefinedProcessEnv): string => {
  if (name in process.env) {
    return process.env[name]
  }
  return undefined
}
