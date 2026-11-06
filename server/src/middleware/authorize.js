import { HttpError } from '../utils/HttpError.js'

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to perform this action.'))
  }
  return next()
}
