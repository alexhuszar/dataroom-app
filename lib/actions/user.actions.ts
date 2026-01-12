"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { User } from "@/lib/db/indexeddb"
import { parseStringify } from "@/lib/utils/general"

export const getCurrentUser = async (): Promise<User | null> => {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user?.email || !user.id) return null

  return parseStringify<User>({
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    accountId: user.email,
    provider: user.provider as "credentials" | "google",
  })
}
