import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const secret = process.env.JWT_SECRET!

type User = {
  user_id: string
  email: string
}

export async function verifyToken (
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log('verifying token')
  const authHeader = req.headers['authorization'] as string | undefined
  if (!authHeader) {
    return res.status(401).redirect('/sign-in')
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    // @ts-ignore
    req.user = decoded as User
    next()
  })
}

export function generateToken (user: User) {
  return jwt.sign(user, secret)
}
