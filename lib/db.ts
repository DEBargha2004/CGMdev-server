import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.MONGODB_CONNECTION_STRING!

export default async function connectDB () {
  mongoose
    .connect(connectionString)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch(err => {
      console.log(err)
      throw new Error('Failed to connect to MongoDB')
    })
}
