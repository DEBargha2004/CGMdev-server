import { Router, Request, Response, json } from 'express'
import { User } from './lib/schema'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { ServerMessage } from './types/server-message'
import { generateToken, verifyToken } from './lib/token'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import fs from 'fs/promises'

dotenv.config()

const router = Router()
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10)

const upload = multer({ dest: 'uploads/' })

router.post('/sign-in', async (req: Request, res: Response) => {
  console.log(req.body)
  const { email, password } = req.body

  console.log(email, password)

  try {
    const existingUser = await User.findOne({
      email: email
    })

    if (existingUser) {
      const compare_res = await bcrypt.compare(password, existingUser.password)
      if (!compare_res) {
        res.json({
          status: 'error',
          title: 'Incorrect Password',
          description: 'The password you entered is incorrect'
        } as ServerMessage)
      } else {
        res.json({
          status: 'success',
          title: 'Sign in successful',
          description: 'The sign in was successful',
          result: {
            token: generateToken({
              user_id: existingUser.user_id,
              email: existingUser.email
            })
          }
        } as ServerMessage<{ token: string }>)
      }
    } else {
      res.json({
        status: 'error',
        title: 'User does not exist',
        description: 'The user does not exist'
      } as ServerMessage)
    }
  } catch (error) {
    res.json({
      status: 'error',
      title: 'Internal Server Error',
      description: 'Something went wrong. Please try again later.'
    } as ServerMessage)
  }
})

router.post('/sign-up', async (req: Request, res: Response) => {
  console.log(req.body)
  const { first_name, last_name, email, password, phone_number, user_name } =
    req.body

  const user_id = `user_${crypto.randomUUID()}`

  try {
    const existingUser = await User.findOne({
      $or: [{ email: email }, { user_name: user_name }]
    })

    console.log(existingUser)

    if (existingUser) {
      res.json({
        status: 'error',
        title: 'User already exists',
        description: 'The user already exists'
      } as ServerMessage)
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      await User.create({
        user_id: user_id,
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashedPassword,
        phone_number: phone_number,
        user_name: user_name
      })
      res.json({
        status: 'success',
        title: 'Sign up successful',
        description: 'The sign up was successful',
        result: {
          token: generateToken({
            user_id: user_id,
            email: email
          })
        }
      } as ServerMessage<{ token: string }>)
    }
  } catch (error) {
    return res.json({
      status: 'error',
      title: 'Internal Server Error',
      description: 'Something went wrong. Please try again later.'
    } as ServerMessage)
  }
})

router.get('/count', async (req: Request, res: Response) => {
  const count = await User.countDocuments()
  res.json({
    status: 'success',
    title: 'User Count',
    description: 'The user count was retrieved successfully',
    result: count
  } as ServerMessage<number>)
})

router.get('/dashboard', verifyToken, async (req: Request, res: Response) => {
  // @ts-ignore
  const { user_id, email } = req.user
  const { start_after } = req.query
  if (user_id && email) {
    const userData = await User.find({
      user_id: { $ne: user_id }
    })
      .select('user_id user_name first_name image_public_id')
      .limit(10)
      .skip(start_after ? parseInt(start_after as string) : 0)
      .exec()

    res.json({
      status: 'success',
      title: 'User Data',
      description: 'The user data was retrieved successfully',
      result: userData
    } as ServerMessage<typeof userData>)
  } else {
    res.redirect('/sign-in')
  }
})

router.get('/check-token', verifyToken, (req: Request, res: Response) => {
  // @ts-ignore
  if (!req?.user) {
    res.json({
      status: 'error',
      title: 'Invalid or expired token',
      description: 'The token is invalid or expired'
    } as ServerMessage)
  } else {
    res.json({
      status: 'success',
      title: 'Token is valid',
      description: 'The token is valid'
    } as ServerMessage)
  }
})

router.get(
  '/current-user',
  verifyToken,
  async (req: Request, res: Response) => {
    const user = await User.findOne({
      // @ts-ignore
      user_id: req.user.user_id
    })
      .select('user_id email image_public_id')
      .exec()
    res.json({
      user_info: user
    })
  }
)

router.post(
  '/upload-image',
  verifyToken,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const { user_id } = req.user
      if (!user_id) {
        res.json({
          status: 'error',
          title: 'Invalid or expired token',
          description: 'The token is invalid or expired'
        } as ServerMessage)
      }

      const result = await cloudinary.uploader.upload(req.file?.path as string)
      const url = result.secure_url
      const public_id = result.public_id

      console.log(url)

      await fs.unlink(req.file?.path as string)

      await User.findOneAndUpdate(
        { user_id: user_id },
        {
          image_public_id: public_id
        }
      )

      res.json({
        status: 'success',
        title: 'Image uploaded successfully',
        description: 'The image was uploaded successfully',
        result: public_id
      } as ServerMessage<string>)
    } catch (error) {
      res.json({
        status: 'error',
        title: 'Internal Server Error',
        description: 'Something went wrong. Please try again later.'
      } as ServerMessage)
    }
  }
)

router.get('/get-image', verifyToken, async (req: Request, res: Response) => {
  // @ts-ignore

  const { public_id } = req.query
  console.log(public_id)
  return cloudinary.url(public_id as string, {
    width: 200,
    height: 200
  })
})

export default router
