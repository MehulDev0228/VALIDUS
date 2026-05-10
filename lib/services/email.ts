/**
 * Transactional email — Resend when `RESEND_API_KEY` is set.
 */

const FROM = process.env.RESEND_FROM_EMAIL || "VERDIKT <onboarding@resend.dev>"

export async function sendWelcomeEmail(to: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: "not_configured" }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to VERDIKT",
      text: `Hi${name ? ` ${name}` : ""},

You now have a private workspace for structured memos before you build.

— VERDIKT`,
    })
    if (error) return { ok: false, error: String(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" }
  }
}

/** Weekly ops digest — sent by `/api/cron/weekly-digest` when `WEEKLY_DIGEST_TO_EMAIL` + Resend are set. */
export async function sendWeeklyDigestStatsEmail(
  to: string,
  memosLast7Days: number,
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: "not_configured" }
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "VERDIKT · weekly pulse",
      text: `Workspace pulse (last 7 days): ${memosLast7Days} memo run(s) recorded in the database.

This is an automated summary for operators. Adjust WEEKLY_DIGEST_TO_EMAIL or disable the cron job if not needed.`,
    })
    if (error) return { ok: false, error: String(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" }
  }
}

export async function sendMemoDeliveryEmail(
  to: string,
  _memoUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: "not_configured" }
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Your VERDIKT memo is ready",
      text: "Open the app to view the full memo in your archive.",
    })
    if (error) return { ok: false, error: String(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send_failed" }
  }
}
