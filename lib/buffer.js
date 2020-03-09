export default {
  encode (text, encoding = 'base64') {
    return Buffer.from(text).toString(encoding)
  },
  decode (buffer, encoding = 'base64') {
    return Buffer.from(buffer, encoding).toString('ascii')
  }
}
