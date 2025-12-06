import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth-config"

export async function getAuthSession() {
  return await getServerSession(authOptions)
}