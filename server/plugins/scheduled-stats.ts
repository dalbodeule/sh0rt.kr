import { refreshGlobalStats } from '~/server/utils/globalStats';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:scheduled', async (payload) => {
    await refreshGlobalStats((payload.env as { DB: unknown }).DB);
  });
});
