
## Campaign Module Deep Audit — Findings & Fix Plan

### Audit Summary

After reading all 12 campaign files, the edge function, hooks, and types, here is the honest state:

**WORKING CORRECTLY:**
- Create / Edit / Delete campaign with all core fields
- Campaign name required validation, start/end date validation, owner defaults to current user, status defaults to Draft
- Accounts tab: search, industry/country filter, bulk add, status updates, pagination
- Contacts tab: search, account/position filter, bulk add, stage tracking, pagination, LinkedIn display
- Outreach tab: log communications (Email/Phone/LinkedIn/Meeting/FollowUp), send email via Microsoft Graph, template placeholders `{{contact_name}}` etc.
- Email sent → contact stage auto-updated to "Email Sent", communication logged in both `campaign_communications` and `email_history`
- Templates tab: create/edit/delete templates, audience segment, email type, "Use Template" → pre-fills Outreach send dialog
- Phone Scripts tab: full CRUD, audience segment
- Materials tab: upload to Supabase storage, download via signed URL, delete
- Tasks/Action Items tab: create/update status/delete tasks, linked to `action_items` table with `module_type='campaigns'`, syncs with global action items
- Analytics tab: 9 stat cards, outreach funnel bar chart, communication pie chart, summary metrics, all live from DB
- Convert to Deal: creates deal at Lead stage, links contact as Champion stakeholder, updates campaign contact stage and account status
- Edge function `send-campaign-email`: already uses `supabase.auth.getUser(token)` — the previously reported bug IS ALREADY FIXED
- RLS policies: all campaign tables have proper authenticated access with creator/admin restrictions

---

### Real Issues Found

**Issue 1 — Duplicate contact in campaign is silently allowed (data integrity)**
`addContact.mutate({ contactId })` has no duplicate check in the hook. The DB has no unique constraint on `(campaign_id, contact_id)`. A contact can be added twice. Same for accounts: `addAccount` has no duplicate prevention. The UI hides already-added IDs client-side, but if the same user opens two tabs, duplicates can occur. Fix: add `ON CONFLICT DO NOTHING` logic or check before insert.

**Issue 2 — Bulk add contacts: sequential awaits, no error recovery**
`handleBulkAdd` loops `for...of` with `await addContact.mutateAsync(...)`. If one fails, the loop stops. Fix: use `Promise.allSettled` and report partial failures.

**Issue 3 — Campaign list aggregates query has 10,000 row limit**
`useCampaignAggregates` fetches all `campaign_accounts`, `campaign_contacts`, and `deals` with `.limit(10000)`. For large datasets this silently truncates. Fix: use `.select('campaign_id', { count: 'exact' })` grouped, or fetch counts per campaign via a DB view/function.

**Issue 4 — Template placeholder `{{sender_name}}` not supported**
The audit requires `{{sender_name}}` as a placeholder. Currently only `{{contact_name}}`, `{{company_name}}`, `{{email}}`, `{{position}}` are processed. Fix: add `{{sender_name}}` resolution using the authenticated user's profile name.

**Issue 5 — Campaign action items not displayed in global Action Items module with campaign context**
Tasks are created with `module_type='campaigns'`, `module_id=campaignId`. The global action items page filters by leads/deals/contacts. Campaign tasks appear in the global list but have no campaign name shown and no link back to the campaign. Fix: in the global action items display, resolve campaign module_id to campaign_name.

**Issue 6 — No inline search/filter on the main Campaigns list**
The main page already has search, status, type, and owner filters — this is correctly implemented. No issue here.

**Issue 7 — Convert to Deal: no duplicate deal prevention**
If a user clicks "Convert to Deal" twice for the same contact, two deals are created. Fix: check if a deal with the same `campaign_id` + `contact` linked as stakeholder already exists before creating.

**Issue 8 — Campaign Overview tab missing Owner display name**
The Overview tab shows Type, Audience, Dates, Region, Country, Description, Message Strategy — but NOT the Owner's display name. Fix: add owner display name lookup in the Overview tab.

**Issue 9 — CampaignContactsTab: account filter uses company_name string match instead of proper account_id join**
Line 57: `c.company_name?.toLowerCase() !== account.accounts?.account_name?.toLowerCase()` — fragile string comparison. Fix: filter by fetching contacts that belong to accounts linked to the campaign using account_id properly.

**Issue 10 — No Campaign cloning feature**
The audit plan lists campaign cloning as a recommended enhancement. Not implemented. Add "Duplicate" option in the list's dropdown menu that copies core fields + templates + scripts.

---

### Implementation Plan

#### Fix 1: Add `{{sender_name}}` placeholder support
**File:** `src/components/campaigns/CampaignOutreachTab.tsx`
- Fetch current user's profile name from `profiles` table (or use auth user metadata)
- Add to both `processedSubject` and `processedBody`: `.replace(/\{\{sender_name\}\}/gi, senderName)`
- Update placeholder hint text to include `{{sender_name}}`

#### Fix 2: Prevent duplicate contacts/accounts
**File:** `src/hooks/useCampaigns.tsx`
- In `addContact.mutationFn`: check `existingIds` before insert. Use upsert with `onConflict: 'campaign_id,contact_id'` approach, or add unique constraint via migration
- In `addAccount.mutationFn`: same pattern for `(campaign_id, account_id)`
- Add DB migration: unique constraints on `campaign_contacts(campaign_id, contact_id)` and `campaign_accounts(campaign_id, account_id)`

#### Fix 3: Fix bulk add to use Promise.allSettled
**Files:** `src/components/campaigns/CampaignAccountsTab.tsx`, `CampaignContactsTab.tsx`
- Replace `for...of` loop with `Promise.allSettled`
- Show toast with count of successes/failures

#### Fix 4: Fix campaign aggregates to be scalable
**File:** `src/hooks/useCampaigns.tsx` — `useCampaignAggregates`
- Replace the current approach: query `campaign_accounts` and `campaign_contacts` with `.select('campaign_id')` but no row limit, and use client-side counting (remove the `.limit(10000)`) — this is the simplest safe fix without a DB migration

#### Fix 5: Add Owner display to Campaign Overview tab
**File:** `src/components/campaigns/CampaignDetailPanel.tsx`
- Add a query for the owner's `full_name` from profiles using `campaign.owner`
- Render in the Overview grid as "Owner" field

#### Fix 6: Prevent duplicate deals on Convert to Deal
**File:** `src/components/campaigns/ConvertToDealDialog.tsx`
- Before creating a deal, check: `SELECT id FROM deals WHERE campaign_id = ? AND id IN (SELECT deal_id FROM deal_stakeholders WHERE contact_id = ?)`
- If found, show warning toast and abort

#### Fix 7: Campaign cloning
**File:** `src/components/campaigns/CampaignList.tsx` + `src/hooks/useCampaigns.tsx`
- Add "Duplicate" item in the `DropdownMenu` for each campaign row
- Add `cloneCampaign` mutation in `useCampaigns` that:
  - Copies the campaign row with name `"Copy of {original_name}"` and status reset to `Draft`
  - Copies all `campaign_email_templates` for the new campaign
  - Copies all `campaign_phone_scripts` for the new campaign
  - Does NOT copy accounts/contacts/communications (fresh start)

#### Fix 8: Fix contact account filter
**File:** `src/components/campaigns/CampaignContactsTab.tsx`
- Fetch contacts with their account linkage from `contacts` table using `account_id` field instead of company_name string match

---

### Summary of Changes

| # | Issue | Files | Priority |
|---|-------|-------|----------|
| 1 | `{{sender_name}}` placeholder | OutreachTab.tsx | Medium |
| 2 | Duplicate contact/account prevention | useCampaigns.tsx + migration | High |
| 3 | Bulk add error recovery | AccountsTab + ContactsTab | Medium |
| 4 | Remove aggregates row limit | useCampaigns.tsx | High |
| 5 | Owner in Overview tab | CampaignDetailPanel.tsx | Low |
| 6 | Duplicate deal prevention | ConvertToDealDialog.tsx | High |
| 7 | Campaign cloning | CampaignList.tsx + useCampaigns.tsx | Medium |
| 8 | Fix contact account filter | CampaignContactsTab.tsx | Medium |

### Files to Modify
- `src/hooks/useCampaigns.tsx` — aggregates fix, cloneCampaign, duplicate prevention
- `src/components/campaigns/CampaignOutreachTab.tsx` — sender_name placeholder
- `src/components/campaigns/CampaignDetailPanel.tsx` — owner display
- `src/components/campaigns/CampaignContactsTab.tsx` — bulk add + account filter fix
- `src/components/campaigns/CampaignAccountsTab.tsx` — bulk add fix
- `src/components/campaigns/CampaignList.tsx` — duplicate + clone button
- `src/components/campaigns/ConvertToDealDialog.tsx` — duplicate deal guard
- New migration: unique constraints on `campaign_contacts` and `campaign_accounts`
