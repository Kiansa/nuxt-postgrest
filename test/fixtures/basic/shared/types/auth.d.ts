declare module '#auth-utils' {
  interface User { name: string }
  interface UserSession { postgrest_token?: string }
}
export {}
