import { FunctionsHttpError, type PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

// The shape of a meeting as the UI uses it
export type MeetingStatus = "pending" | "processing" | "done" | "failed";
export type Meeting = {
    id: string;
    title: string;
    meetingDate: string; // ISO date
    startTime: string | null; // 24h time (Null when unknown)
    status: MeetingStatus;
    openActionItems: number;
    isStarred: boolean;
    archivedAt: string | null; // Null while the meeting is active.
};

// The details the edit dialog can change.
export type MeetingDetails = {
    title: string;
    meetingDate: string;
    startTime: string | null;
};

// One decision, as the meeting view shows it.
export type Decision = {
    id: string;
    description: string;
    editedAt: string | null; // When a person last changed it. Null if never.
};
export type ActionItemStatus = "todo" | "in_progress" | "done";
// One action item. Owner and due date stay null when the transcript does not say.
export type ActionItem = {
    id: string;
    description: string;
    owner: string | null;
    dueDate: string | null; // ISO date
    status: ActionItemStatus;
    needsReview: boolean;
    position: number;
    editedAt: string | null;
};
// A whole meeting: details, transcript, and what was found in it.
export type MeetingDetail = {
    id: string;
    title: string;
    meetingDate: string;
    startTime: string | null;
    status: MeetingStatus;
    summary: string | null;
    summaryEditedAt: string | null;
    transcript: string;
    decisions: Decision[];
    actionItems: ActionItem[];
    // How many changes people have made. The History button only shows when above 0.
    historyCount: number;
};

// What the new meeting form sends. The owner is filled in by the DB
export type NewMeeting = {
    title: string;
    meetingDate: string;
    startTime: string | null;
    transcript: string;
    source: "upload" | "paste";
    fileName: string | null;
};

// Returns all of the signed-in user's meetings, archived ones included:
// starred first, then newest first. The list is filtered and searched in the
// browser, so all of it is loaded. Fine for hundreds of meetings, not thousands.
// No user_id filter: Row Level Security already limits the rows to this user.
export async function getMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
        .from("meetings")
        // action_items(count) asks for a count of each meeting's items instead
        // of the items themselves. The transcript is left out on purpose.
        .select(
            "id, title, meeting_date, start_time, analysis_status, is_starred, archived_at, action_items(count)",
        )
        // Only count items that are not done.
        .neq("action_items.status", "done")
        .order("is_starred", { ascending: false })
        .order("meeting_date", { ascending: false })
        .order("created_at", { ascending: false });
    if (error) throw new Error(meetingErrorMessage(error));
    // Turn database rows (snake_case) into the shape the UI uses (camelCase).
    return data.map((row) => ({
        id: row.id,
        title: row.title,
        meetingDate: row.meeting_date,
        startTime: row.start_time,
        // The check constraint on analysis_status only allows these four values.
        status: row.analysis_status as MeetingStatus,
        openActionItems: row.action_items[0]?.count ?? 0,
        isStarred: row.is_starred,
        archivedAt: row.archived_at,
    }));
}

// Saves a meeting's title, date and start time.
// .select("id").single() turns "no row changed" into an error, because RLS
// matches nothing rather than failing when the meeting is not yours.
export async function updateMeetingDetails(id: string, details: MeetingDetails): Promise<void> {
    const { error } = await supabase
        .from("meetings")
        .update({
            title: details.title.trim(),
            meeting_date: details.meetingDate,
            start_time: details.startTime,
        })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(meetingErrorMessage(error));
}

// Stars or unstars a meeting.
export async function setMeetingStarred(id: string, isStarred: boolean): Promise<void> {
    const { error } = await supabase
        .from("meetings")
        .update({ is_starred: isStarred })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(meetingErrorMessage(error));
}

// Archives a meeting, or restores it when isArchived is false. Returns the
// timestamp that was saved, so the list can show it straight away.
export async function setMeetingArchived(id: string, isArchived: boolean): Promise<string | null> {
    const archivedAt = isArchived ? new Date().toISOString() : null;
    const { error } = await supabase
        .from("meetings")
        .update({ archived_at: archivedAt })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(meetingErrorMessage(error));
    return archivedAt;
}

// Returns one meeting with its decisions and action items, or null when there is
// no such meeting. Row Level Security hides other users' meetings, so asking for
// someone else's id also returns null: the page cannot tell it apart from a
// meeting that does not exist.
export async function getMeeting(id: string): Promise<MeetingDetail | null> {
    const { data, error } = await supabase
        .from("meetings")
        // Embeds the related rows through their foreign keys, so one request
        // returns the meeting, its decisions and its action items. It must stay
        // one string: Supabase reads it to work out the types of the result.
        .select(`
id, title, meeting_date, start_time, analysis_status, summary, summary_edited_at, transcript,
decisions(id, description, edited_at),
action_items(id, description, owner, due_date, status, needs_review, position, edited_at),
edit_history(count)
`)
        .eq("id", id)
        // Sorts the embedded rows: decisions in the order they were added,
        // action items in their manual order.
        .order("created_at", { referencedTable: "decisions" })
        .order("position", { referencedTable: "action_items" })
        // maybeSingle returns null for no row; single would return an error.
        .maybeSingle();
    // 22P02: the id is not a valid uuid, for example /meetings/abc. Treated as not found.
    if (error?.code === "22P02") return null;
    if (error) throw new Error(meetingErrorMessage(error));
    if (!data) return null;
    return {
        id: data.id,
        title: data.title,
        meetingDate: data.meeting_date,
        startTime: data.start_time,
        status: data.analysis_status as MeetingStatus,
        summary: data.summary,
        summaryEditedAt: data.summary_edited_at,
        transcript: data.transcript,
        decisions: data.decisions.map((decision) => ({
            id: decision.id,
            description: decision.description,
            editedAt: decision.edited_at,
        })),
        actionItems: data.action_items.map((item) => ({
            id: item.id,
            description: item.description,
            owner: item.owner,
            dueDate: item.due_date,
            // The check constraint on status only allows these three values.
            status: item.status as ActionItemStatus,
            needsReview: item.needs_review,
            position: item.position,
            editedAt: item.edited_at,
        })),
        historyCount: data.edit_history[0]?.count ?? 0,
    };
}

// Asks the analyse-meeting Edge Function to analyse a meeting. Resolves when the
// summary, decisions and action items are saved; throws a plain message if not.
export async function analyseMeeting(id: string): Promise<void> {
    const { error } = await supabase.functions.invoke("analyse-meeting", {
        body: { meetingId: id },
    });
    if (!error) return;
    // The function answered with an error status. Its body is { error: "message" }.
    if (error instanceof FunctionsHttpError) {
        const body = await error.context.json().catch(() => null);
        throw new Error(body?.error ?? "The analysis failed. Try again.");
    }
    // The request never got an answer, e.g. no connection.
    throw new Error(
        "Could not reach the analysis service. Check your connection and try again.",
    );
}

// Saves a new meeting and returns its id. Its analysis status starts as pending.
export async function createMeeting(meeting: NewMeeting): Promise<string> {
    const { data, error } = await supabase
        .from("meetings")
        .insert({
            title: meeting.title.trim(),
            meeting_date: meeting.meetingDate,
            start_time: meeting.startTime,
            transcript: meeting.transcript,
            source: meeting.source,
            file_name: meeting.fileName,
        })
        // Return the new row's id, so the app can open it later.
        .select("id")
        .single();
    if (error) throw new Error(meetingErrorMessage(error));
    return data.id;
}

// Turns database errors into plain messages.
function meetingErrorMessage(error: PostgrestError): string {
    switch (error.code) {
        // A check constraint rejected a value, such as an empty title.
        case "23514":
            return "Something in the form was not accepted. Check the title, date and transcript.";
        // Row Level Security or a column permission blocked the request.
        case "42501":
            return "You do not have permission to do that. Try logging in again.";
        default:
            return "Something went wrong. Check your connection and try again.";
    }
}

// Format "2026-11-18" as "18 November 2026".
// Adding T00:00:00 makes the browser read it as local time; a bare date is read
// as UTC midnight, which shows as the previous day in time zones behind UTC.
export function formatMeetingDate(isoDate: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(`${isoDate}T00:00:00`));
}

// Format "09:30:00" or "09:30" as "09:30". Postgres time columns include seconds.
export function formatStartTime(time: string | null): string | null {
    return time ? time.slice(0, 5) : null;
}
