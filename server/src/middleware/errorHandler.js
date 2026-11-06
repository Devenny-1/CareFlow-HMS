import { HttpError } from '../utils/HttpError.js'

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error?.code === 11000) {
    return res.status(409).json({ error: 'A record with that unique value already exists.' })
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ error: 'The requested record identifier is invalid.' })
  }

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  const status = error instanceof HttpError ? error.status : 500
  if (status >= 500) {
    console.error(error)
  }

  const response = { error: status === 500 ? 'An unexpected server error occurred.' : error.message }
  if (error instanceof HttpError && error.details) {
    response.details = error.details
  }
  return res.status(status).json(response)
}
