import { GET, POST } from '@/lib/auth'

export { GET, POST }

// Use Node.js runtime because auth uses bcrypt and Node APIs
export const runtime = 'nodejs'