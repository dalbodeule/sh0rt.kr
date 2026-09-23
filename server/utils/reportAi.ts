import { eq } from 'drizzle-orm';
import { reports } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';

const AI_MODEL = 'typesafe/jev';
const AI_CATEGORIES = ['spam', 'phishing', 'malware', 'illegal', 'other'] as const;

type AiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>;
};

export type ReportAiEnvironment = {
  DB: D1Database;
  AI?: AiBinding;
};

type AiAnswer = {
  noul?: unknown;
  choice?: unknown;
  score?: unknown;
  confidence?: unknown;
  probabilities?: Record<string, unknown>;
};

type ReportAiReview = {
  status: 'completed' | 'failed' | 'unavailable';
  likelyAbuse: boolean | null;
  category: string | null;
  severity: number | null;
  confidence: number | null;
  checkedAt: Date | null;
  error: string | null;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100)));

const sanitizeUrlForAi = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

const getAnswers = (response: unknown): Record<string, AiAnswer> => {
  if (!response || typeof response !== 'object') throw new Error('Invalid AI response');
  const answers = (response as { answers?: unknown }).answers;
  if (!answers || typeof answers !== 'object') throw new Error('Missing AI answers');
  return answers as Record<string, AiAnswer>;
};

export async function analyzeReportWithAi(
  reportId: number,
  env: ReportAiEnvironment
): Promise<ReportAiReview | null> {
  const db = useDrizzle(env.DB);
  const report = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });
  if (!report) return null;

  if (!env.AI) {
    const unavailable: ReportAiReview = {
      status: 'unavailable',
      likelyAbuse: null,
      category: null,
      severity: null,
      confidence: null,
      checkedAt: null,
      error: 'AI binding is unavailable',
    };
    await db
      .update(reports)
      .set({ ai_status: unavailable.status, ai_error: unavailable.error })
      .where(eq(reports.id, reportId));
    return unavailable;
  }

  await db
    .update(reports)
    .set({ ai_status: 'processing', ai_error: null })
    .where(eq(reports.id, reportId));

  try {
    const response = await env.AI.run(AI_MODEL, {
      state: {
        report_type: report.reason,
        report_details: report.details || report.body_text || '',
        reported_url: report.tld && report.uid ? `https://${report.tld}/${report.uid}` : null,
        destination_url: sanitizeUrlForAi(report.forward),
      },
      questions: {
        likely_abuse: {
          type: 'noul',
          instructions:
            'Does the available evidence indicate that the reported short link is likely abusive? Treat the report as an allegation, not proof. Consider phishing, malware, spam, illegal content, deceptive redirects, and clear benign explanations.',
          criteria: {
            true: 'There are concrete indicators of abuse or a strong match between the evidence and the reported abuse type.',
            false:
              'The evidence is weak, ambiguous, benign, or insufficient to support an abuse finding.',
          },
        },
        category: {
          type: 'choice',
          instructions: 'Which abuse category best matches the evidence, if any?',
          criteria: {
            spam: 'Unwanted promotion, bulk messaging, or deceptive traffic generation.',
            phishing: 'Credential theft, impersonation, or deceptive account/payment collection.',
            malware: 'Malware, exploit delivery, suspicious downloads, or harmful software.',
            illegal: 'Content or activity that appears to violate applicable law.',
            other: 'Insufficient evidence or abuse that does not fit the other categories.',
          },
        },
        severity: {
          type: 'score',
          instructions: 'How severe is the potential abuse based only on the supplied evidence?',
          criteria: [
            'Low: weak evidence, low impact, or likely benign',
            'Moderate: credible concern requiring human review',
            'High: strong evidence of active harm or significant user risk',
          ],
        },
      },
    });

    const answers = getAnswers(response);
    const abuseAnswer = answers.likely_abuse;
    const abuseProbability = typeof abuseAnswer?.noul === 'number' ? abuseAnswer.noul : null;
    const likelyAbuse = abuseProbability === null ? null : abuseProbability >= 0.5;
    const category =
      typeof answers.category?.choice === 'string' &&
      AI_CATEGORIES.includes(answers.category.choice as (typeof AI_CATEGORIES)[number])
        ? answers.category.choice
        : null;
    const severity =
      typeof answers.severity?.score === 'number'
        ? Math.max(0, Math.min(2, Math.round(answers.severity.score)))
        : null;
    const categoryConfidence =
      typeof answers.category?.confidence === 'number' ? answers.category.confidence : null;
    const abuseConfidence =
      abuseProbability === null ? null : Math.max(abuseProbability, 1 - abuseProbability);
    const confidence =
      categoryConfidence === null && abuseConfidence === null
        ? null
        : clampPercent(Math.max(categoryConfidence ?? 0, abuseConfidence ?? 0));
    const checkedAt = new Date();
    const result: ReportAiReview = {
      status: 'completed',
      likelyAbuse,
      category,
      severity,
      confidence,
      checkedAt,
      error: null,
    };

    await db
      .update(reports)
      .set({
        ai_status: result.status,
        ai_likely_abuse: likelyAbuse === null ? null : likelyAbuse ? 1 : 0,
        ai_category: category,
        ai_severity: severity,
        ai_confidence: confidence,
        ai_checked_at: checkedAt,
        ai_error: null,
      })
      .where(eq(reports.id, reportId));
    return result;
  } catch {
    const failed: ReportAiReview = {
      status: 'failed',
      likelyAbuse: null,
      category: null,
      severity: null,
      confidence: null,
      checkedAt: new Date(),
      error: 'AI review failed',
    };
    await db
      .update(reports)
      .set({ ai_status: failed.status, ai_checked_at: failed.checkedAt, ai_error: failed.error })
      .where(eq(reports.id, reportId));
    return failed;
  }
}

export function scheduleReportAiReview(
  event: {
    context?: {
      waitUntil?: (promise: Promise<unknown>) => void;
      cloudflare?: { env?: unknown };
    };
  },
  reportId: number
) {
  const env = event.context?.cloudflare?.env as ReportAiEnvironment | undefined;
  if (!env?.DB) return;
  const task = analyzeReportWithAi(reportId, env).catch(() => undefined);
  if (event.context?.waitUntil) event.context.waitUntil(task);
  else void task;
}
