import mongoose from 'mongoose'

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is required to connect to the careflow_hms database.')
  }

  await mongoose.connect(uri, { dbName: 'careflow_hms' })
  return mongoose.connection
}
