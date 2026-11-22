import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
    analysisJsonSchema,
    checkActionItems,
    MAX_TRANSCRIPT_LENGTH,
    parseAnalysis,
    systemPrompt,
    userPrompt,
} from './analysis.ts'

const OPENROUTER_URL =
    Deno.env.get('OPENROUTER_URL') ?? 'https://openrouter.ai/api/v1/chat/completions'
// How long to wait for the model before giving up.
const AI_TIMEOUT_MS = 60_000
// A run stuck in "processing" this long is treated as crashed and may be started again.
const STALE_RUN_MS = 2 * 60_000
// Free models are rate limited, so each user gets a fixed number of runs per day.
const DAILY_RUN_LIMIT = 20
// The browser calls this function from another origin, so it needs CORS headers.
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
// z.guid accepts any id in uuid format. z.uuid only accepts standard versions,
// which would reject the seed meetings' ids.
const RequestSchema = z.object({ meetingId: z.guid() })
// A failure with a message that is safe to show the user, and the details kept for debugging.
class AnalysisError extends Error {
    constructor(
        public userMessage: string,
        public status: number,
        detail?: string,
    ) {
        super(detail ?? userMessage)
    }
}

function reply(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return reply(405, { error: 'Use POST.' })
    // A client that acts as the caller: every query below goes through Row Level
    // Security, so this function can only reach the caller's own meetings.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return reply(401, { error: 'Log in again to analyse meetings.' })
    const parsed = RequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return reply(400, { error: 'Send the id of the meeting to analyse.' })
    const { meetingId } = parsed.data
    const { data: meeting } = await supabase
        .from('meetings')
        .select('id, title, meeting_date, transcript, analysis_status')
        .eq('id', meetingId)
        .maybeSingle()
    if (!meeting) return reply(404, { error: 'Meeting not found.' })
    if (meeting.transcript.length > MAX_TRANSCRIPT_LENGTH) {
        return reply(422, {
            error: 'This transcript is too long to analyse. Split it into shorter meetings.',
        })
    }
    if (await runsToday(supabase) >= DAILY_RUN_LIMIT) {
        return reply(429, {
            error: `You have used all ${DAILY_RUN_LIMIT} analyses for today. Try again tomorrow.`,
        })
    }
    // Claims the meeting by moving it to "processing". The filters make this a
    // single atomic step: a second click, or a second tab, finds nothing to
    // claim and stops here instead of running the analysis twice.
    const staleBefore = new Date(Date.now() - STALE_RUN_MS).toISOString()
    const { data: claimed } = await supabase
        .from('meetings')
        .update({ analysis_status: 'processing', analysis_error: null })
        .eq('id', meetingId)
        .neq('analysis_status', 'done')
        .or(`analysis_status.neq.processing,updated_at.lt.${staleBefore}`)
        .select('id')
        .maybeSingle()
    if (!claimed) {
        return reply(409, { error: 'This meeting is already analysed, or an analysis is running.' })
    }
    const model = Deno.env.get('OPENROUTER_MODEL') ?? ''
    const startedAt = Date.now()
    let raw: unknown = null
    let usage: { prompt_tokens?: number; completion_tokens?: number } = {}
    try {
        const response = await callModel(model, meeting.meeting_date, meeting.title, meeting.transcript)
        raw = response.raw
        usage = response.usage
        const analysis = parseAnalysis(response.content)
        const actionItems = checkActionItems(analysis.action_items, meeting.transcript)
        const { error: saveError } = await supabase.rpc('save_analysis', {
            p_meeting_id: meetingId,
            p_summary: analysis.summary,
            p_decisions: analysis.decisions,
            p_action_items: actionItems,
        })
        if (saveError) {
            throw new AnalysisError('The analysis could not be saved. Try again.', 500, saveError.message)
        }
        await recordRun(supabase, meetingId, model, 'succeeded', null, startedAt, usage, raw)
        return reply(200, { status: 'done' })
    } catch (caught) {
        const error =
            caught instanceof AnalysisError
                ? caught
                : new AnalysisError(
                    'The AI reply could not be used. Try again.',
                    502,
                    caught instanceof Error ? caught.message : String(caught),
                )
        console.error('analyse-meeting failed:', error.message)
        // The transcript is never touched: the meeting is marked failed and can be retried.
        await supabase
            .from('meetings')
            .update({ analysis_status: 'failed', analysis_error: error.userMessage })
            .eq('id', meetingId)
        await recordRun(supabase, meetingId, model, 'failed', error.message, startedAt, usage, raw)
        return reply(error.status, { error: error.userMessage })
    }
})
// Sends one request to OpenRouter and returns the text of the reply.
async function callModel(model: string, meetingDate: string, title: string, transcript: string) {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey || !model) {
        throw new AnalysisError('Analysis is not set up on the server yet.', 503, 'Missing key or model')
    }
    let response: Response
    try {
        response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // A comma-separated list gives fallbacks: OpenRouter tries the next when one is busy.
                models: model.split(',').map((id) => id.trim()),
                temperature: 0,
                messages: [
                    { role: 'system', content: systemPrompt(meetingDate) },
                    { role: 'user', content: userPrompt(title, transcript) },
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: { name: 'meeting_analysis', strict: true, schema: analysisJsonSchema },
                },
            }),
            signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        })
    } catch (caught) {
        const timedOut = caught instanceof DOMException && caught.name === 'TimeoutError'
        throw new AnalysisError(
            timedOut
                ? 'The AI took too long to reply. Try again in a minute.'
                : 'Could not reach the AI service. Try again later.',
            504,
            String(caught),
        )
    }
    const raw = await response.json().catch(() => null)
    if (!response.ok) {
        const detail = `OpenRouter ${response.status}: ${JSON.stringify(raw)}`
        if (response.status === 429) {
            throw new AnalysisError('The free AI model is busy. Try again in a minute.', 429, detail)
        }
        if (response.status === 402) {
            throw new AnalysisError('The AI service is out of credit. Try again later.', 503, detail)
        }
        throw new AnalysisError('The AI service is unavailable. Try again later.', 502, detail)
    }
    const content = raw?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.trim() === '') {
        const detail = `Empty reply: ${JSON.stringify(raw)}`
        throw new AnalysisError('The AI sent an empty reply. Try again.', 502, detail)
    }
    return { content, raw, usage: raw?.usage ?? {} }
}
// How many analyses the caller has started since midnight (UTC).
async function runsToday(supabase: SupabaseClient): Promise<number> {
    const midnight = new Date()
    midnight.setUTCHours(0, 0, 0, 0)
    const { count } = await supabase
        .from('analysis_runs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', midnight.toISOString())
    return count ?? 0
}
// Keeps one row per attempt, with the raw reply, so failures can be inspected later.
async function recordRun(
    supabase: SupabaseClient,
    meetingId: string,
    model: string,
    status: 'succeeded' | 'failed',
    error: string | null,
    startedAt: number,
    usage: { prompt_tokens?: number; completion_tokens?: number },
    raw: unknown,
) {
    const { error: insertError } = await supabase.from('analysis_runs').insert({
        meeting_id: meetingId,
        model: model || 'not set',
        status,
        error: error?.slice(0, 1000) ?? null,
        duration_ms: Date.now() - startedAt,
        prompt_tokens: usage.prompt_tokens ?? null,
        completion_tokens: usage.completion_tokens ?? null,
        raw_response: raw,
    })
    if (insertError) console.error('Could not record the analysis run:', insertError.message)
}
