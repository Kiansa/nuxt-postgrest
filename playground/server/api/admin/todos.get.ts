// Admin client: bypasses RLS via the service_role secret (NUXT_POSTGREST_SECRET_KEY)
export default defineEventHandler(async () => {
  const { data, error } = await usePostgrestAdmin().from('todos').select('*').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
