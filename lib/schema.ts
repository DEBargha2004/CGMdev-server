import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone_number: { type: String, required: true },
  user_name: { type: String, required: true },
  image_public_id: { type: String }
})

const User = mongoose.model('User', userSchema)

export { User }
