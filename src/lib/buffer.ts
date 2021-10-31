export const encodeBuffer = (
  text: string,
  encoding: BufferEncoding = 'base64'
) => Buffer.from(text).toString(encoding)

export const decodeBuffer = (
  buffer: string,
  encoding: BufferEncoding = 'base64'
) => Buffer.from(buffer, encoding).toString('ascii')
