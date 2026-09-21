// User client: RLS applies as the logged-in user (token read from the session)
export default defineEventHandler(async (event) => {
  const postgrest = await usePostgrestUser(event)
  const { data, error } = await postgrest.from('todos').select('*').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
