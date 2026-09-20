import { UserRole } from '~/server/db/schema';
import { requireRole } from '~/server/utils/requireRole';
import { analyzeReportWithAi } from '~/server/utils/reportAi';
import type { ReportAiEnvironment } from '~/server/utils/reportAi';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report id' });
  }

  const result = await analyzeReportWithAi(
    id,
    event.context.cloudflare.env as unknown as ReportAiEnvironment
  );
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Report not found' });
  return { success: result.status === 'completed', ai: result };
});
