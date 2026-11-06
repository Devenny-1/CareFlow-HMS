import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { HttpError } from '../utils/HttpError.js'

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return next(new HttpError(401, 'Sign in to continue.'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id name email role department active')
    if (!user || !user.active) {
      return next(new HttpError(401, 'Your session is no longer active.'))
    }
    req.user = user
    return next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new HttpError(401, 'Your session is invalid or has expired.'))
    }
    return next(error)
  }
}
