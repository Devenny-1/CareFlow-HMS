import './config/env.js'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT ?? 4000)

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET is missing or too short. Copy server\\.env.example to server\\.env and set a random secret of at least 32 characters.')
}

await connectDatabase()
app.listen(port, () => {
  console.log(`CareFlow HMS API listening on http://localhost:${port}`)
})
