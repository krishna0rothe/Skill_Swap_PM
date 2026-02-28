const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
})

const isMultipartRequest = (req) => {
  const contentType = req.headers['content-type'] || ''
  return contentType.includes('multipart/form-data')
}

const parseMultipartIfNeeded = (req, res, next) => {
  if (!isMultipartRequest(req)) {
    return next()
  }

  return upload.any()(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: `Multipart parsing failed: ${error.message}` })
    }

    return next()
  })
}

const logMultipartPayload = (req, _res, next) => {
  if (!isMultipartRequest(req)) {
    return next()
  }

  const files = Array.isArray(req.files) ? req.files : []
  const bodyKeys = Object.keys(req.body || {})

  console.log(
    JSON.stringify({
      scope: 'roadmap-multipart-log',
      method: req.method,
      path: req.originalUrl,
      bodyKeys,
      files: files.map((file) => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      })),
    }),
  )

  return next()
}

module.exports = {
  parseMultipartIfNeeded,
  logMultipartPayload,
}
