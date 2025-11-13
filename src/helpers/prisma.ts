import { PrismaClient } from "@/generated/prisma/client"

// import { withAccelerate } from "@prisma/extension-accelerate"
// const prisma = new PrismaClient({
// 	datasourceUrl: import.meta.env.DATABASE_URL,
// }).$extends(withAccelerate())

import { PrismaNeon } from "@prisma/adapter-neon"
const connectionString = import.meta.env.DATABASE_URL
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma
