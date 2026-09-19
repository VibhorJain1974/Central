# The AARVAK CENTRAL emails

Five templates. They replace Supabase's default ones, which look like a
password reset from 2011.

## Where they go

Central Supabase project, left sidebar **Authentication**, then **Emails**.
Pick a template on that page, switch the editor to **Source** (or the `</>`
view), delete everything in the box, paste the whole file in, Save.

| File | Supabase template |
|---|---|
| `01-confirm-signup.html` | Confirm signup |
| `02-invite.html` | Invite user |
| `03-magic-link.html` | Magic Link |
| `04-reset-password.html` | Reset Password |
| `05-change-email.html` | Change Email Address |

Set the subject lines on the same page:

- Confirm signup: `Confirm your email — AARVAK CENTRAL`
- Invite user: `You have been added to AARVAK CENTRAL`
- Magic Link: `Your sign-in link — AARVAK CENTRAL`
- Reset Password: `Set a new password — AARVAK CENTRAL`
- Change Email Address: `Confirm your new email — AARVAK CENTRAL`

## Read this before you send anything to thirteen people

Supabase's built-in email is a courtesy, not a mail service. On the free plan
it is rate limited to a handful of messages an hour, it sends from
`mail.app.supabase.io`, and a decent share of it lands in spam or is dropped
outright. Mayank's confirmation arriving is luck, not proof it works.

You have two ways out.

**The simple one, and what I would do.** Turn email confirmation off.
Authentication, then Sign In / Providers, then Email, and switch off **Confirm
email**. Nobody on central needs it: access is already gated by an enrolment
code that is one use and tied to a specific address. The confirmation email
adds a step, a delay and a spam risk, and protects against nothing that the
code does not already cover.

Password reset still works and still uses the template, so this is not wasted.

**The proper one.** Plug in real SMTP. Resend gives you 3,000 emails a month
free, and Supabase has a field for it under Authentication, SMTP Settings. It
needs a domain you control, so it is a job for when AARVAK has one.

## Adding the team logos later

The wordmark is drawn in text and a bordered box, on purpose. Gmail strips SVG
and blocks remote images by default, so a logo file would have shown as a
broken rectangle for half your society.

Once the site is live at a fixed address, drop a PNG at `/mark.png` and swap
the bordered box for:

```html
<img src="https://YOUR-DOMAIN/mark.png" width="30" height="30" alt="AARVAK"
     style="display:block;border:0;">
```

Keep the text wordmark next to it either way. It is what people see when images
are blocked.

## Changing the words

Everything inside the card is plain text. Edit it. The only parts you must not
touch are the `{{ .ConfirmationURL }}` and `{{ .Token }}` placeholders, which
Supabase fills in when it sends. Delete those and the email goes out with a
dead button.
