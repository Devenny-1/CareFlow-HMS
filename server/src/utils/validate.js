import { HttpError } from './HttpError.js'

export function validate(schema, input) {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new HttpError(400, 'Please check the submitted information.', result.error.issues.map(({ path, message }) => ({
      field: path.join('.'),
      message,
    })))
  }
  return result.data
}
