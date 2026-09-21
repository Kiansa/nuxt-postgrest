export default defineEventHandler(async () => {
  const { data, error } = await usePostgrestAdmin().from('todos').select('title').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data.map(t => t.title)
})
