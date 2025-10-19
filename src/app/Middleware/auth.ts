import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends NextApiRequest {
  userId?: string
}

export const authMiddleware = (handler: Function) => async (req: AuthRequest, res: NextApiResponse) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'Unauthorized' })

  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!)
    req.userId = payload.userId
    return handler(req, res)
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
