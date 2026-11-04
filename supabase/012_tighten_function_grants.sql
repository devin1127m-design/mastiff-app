-- Internal functions are not for the API. The secret-checked ones stay callable by anon on purpose.
revoke execute on function queue_hold_notification() from public, anon, authenticated;
revoke execute on function queue_callback_notification() from public, anon, authenticated;
revoke execute on function my_partner_ids() from public, anon;
revoke execute on function claim_invites() from public, anon;
revoke execute on function digest_counts(text, uuid, timestamptz) from authenticated;
revoke execute on function digest_recipients(text) from authenticated;
revoke execute on function notifications_mark(text, uuid, text, text) from authenticated;
revoke execute on function notifications_queue(text, uuid, text, text, text, text) from authenticated;
revoke execute on function notifications_take(text, int) from authenticated;
revoke execute on function org_for_inbound(text, text) from authenticated;
revoke execute on function receive_email(text, text, text, text, text, text, jsonb, uuid, text, jsonb, numeric, text, text, text, text[], text[], uuid, boolean) from authenticated;
