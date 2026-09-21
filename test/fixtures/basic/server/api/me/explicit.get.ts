import { signDevJwt } from '../../utils/jwt'

// Explicit token wins over the session token
export default defineEventHandler(async (event) => {
  const token = signDevJwt({ role: 'authenticated', sub: 'bob' })
  const { data, error } = await (await usePostgrestUser(event, { token })).from('todos').select('title').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data.map(t => t.title)
})
