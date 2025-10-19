import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/models/User'
import { connectDB } from '@/lib/db'

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie')
  const token = cookieHeader
    ?.split('; ')
    .find((c) => c.startsWith('token='))
    ?.split('=')[1]

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!)
    await connectDB()
    const user = await User.findById(payload.userId).select('-passwordHash')
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('JWT error:', error)
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
}
