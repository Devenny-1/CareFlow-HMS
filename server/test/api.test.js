import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'
const { default: app } = await import('../src/app.js')

test('health endpoint reports API availability without a database connection', async () => {
  const response = await request(app).get('/api/health')
  assert.equal(response.status, 200)
  assert.equal(response.body.status, 'ok')
})

test('protected patient data requires authentication', async () => {
  const response = await request(app).get('/api/patients')
  assert.equal(response.status, 401)
  assert.equal(response.body.error, 'Sign in to continue.')
})

test('login rejects invalid input before attempting database access', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email' })
  assert.equal(response.status, 400)
  assert.equal(response.body.error, 'Please check the submitted information.')
  assert.equal(response.body.details[0].field, 'email')
})

test('unknown API routes return a JSON 404 response', async () => {
  const response = await request(app).get('/api/not-a-route')
  assert.equal(response.status, 404)
  assert.equal(response.body.error, 'The requested API route was not found.')
})
