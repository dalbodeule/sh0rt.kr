import { consola } from 'consola'
import { migrate } from 'drizzle-orm/d1/migrator'
import { useDrizzle } from "~/server/utils/useDrizzle"

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  onHubReady(async () => {
    await migrate(useDrizzle(), { migrationsFolder: 'server/db/migrations' })
      .then(() => {
        consola.success('Database migrations done')
      })
      .catch((err) => {
        consola.error('Database migrations failed', err)
      })
  })
})