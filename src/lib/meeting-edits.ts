import type { PostgrestError } from "@supabase/supabase-js";
import type { ActionItemStatus } from "@/lib/meetings";
import { supabase } from "@/lib/supabase";
// Limits from the check constraints, so the forms can stop a value before saving.
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_OWNER_LENGTH = 100;
export const MAX_SUMMARY_LENGTH = 5000;
// What the action item form sends. Empty owner and due date are null, never "".
export type ActionItemFields = {
    description: string;
    owner: string | null;
    dueDate: string | null;
    status: ActionItemStatus;
};
// Every function here changes one row and checks that a row really changed.
// RLS does not raise an error for someone else's row: it just matches nothing.
// .select('id').single() turns "nothing matched" into an error (PGRST116).
// Saves the action item form. A person has now checked the item, so the
// "Needs review" flag is cleared.
export async function updateActionItem(
    id: string,
    fields: ActionItemFields,
): Promise<void> {
    const { error } = await supabase
        .from("action_items")
        .update({
            description: fields.description.trim(),
            owner: fields.owner,
            due_date: fields.dueDate,
            status: fields.status,
            needs_review: false,
        })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(editErrorMessage(error));
}
// Ticks an item off, or opens it again, without opening the form.
export async function setActionItemStatus(
    id: string,
    status: ActionItemStatus,
): Promise<void> {
    const { error } = await supabase
        .from("action_items")
        .update({ status })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(editErrorMessage(error));
}
// Assigns an item to a user, or clears the assignee with null. The database
// only accepts the meeting's owner, so this cannot assign anyone else.
export async function setActionItemAssignee(
    id: string,
    assigneeId: string | null,
): Promise<void> {
    const { error } = await supabase
        .from("action_items")
        .update({ assignee_id: assigneeId })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(editErrorMessage(error));
}
// Adds an item at the end of the list.
export async function createActionItem(
    meetingId: string,
    fields: ActionItemFields,
    position: number,
): Promise<void> {
    const { error } = await supabase.from("action_items").insert({
        meeting_id: meetingId,
        description: fields.description.trim(),
        owner: fields.owner,
        due_date: fields.dueDate,
        status: fields.status,
        position,
    });
    if (error) throw new Error(editErrorMessage(error));
}
export async function deleteActionItem(id: string): Promise<void> {
    const { error } = await supabase.from("action_items").delete().eq("id", id)
        .select("id").single();
    if (error) throw new Error(editErrorMessage(error));
}
export async function updateDecision(
    id: string,
    description: string,
): Promise<void> {
    const { error } = await supabase
        .from("decisions")
        .update({ description: description.trim() })
        .eq("id", id)
        .select("id")
        .single();
    if (error) throw new Error(editErrorMessage(error));
}
export async function updateSummary(
    meetingId: string,
    summary: string,
): Promise<void> {
    const { error } = await supabase
        .from("meetings")
        .update({ summary: summary.trim() })
        .eq("id", meetingId)
        .select("id")
        .single();
    if (error) throw new Error(editErrorMessage(error));
}
// Turns database errors into plain messages.
function editErrorMessage(error: PostgrestError): string {
    switch (error.code) {
        // No row matched: it was deleted, or belongs to someone else.
        case "PGRST116":
            return "This was deleted or can no longer be found. Reload the page.";
        // A check constraint rejected a value, such as an empty description.
        case "23514":
            return "That was not accepted. Check the text is not empty or too long.";
        case "42501":
            return "You do not have permission to change this. Try logging in again.";
        default:
            return "Could not save. Check your connection and try again.";
    }
}
