# AARVAK CENTRAL — the website

This is the front end for central. It is one Next.js app with two halves.

**The public half** is the board at `/`. Anyone can open it with no account.
It shows the published standing, how a point gets there, the five teams, and
the full point catalog.

**The private half** is the console at `/console`. Only people holding an
enrolment code can get in. It is where Harsh and Daksh review submissions,
award bonuses, take points away, and publish the board.

---

## What you need before you start

Two values from the central Supabase project. Both of them are safe to put in
a private repo and safe in a browser. Neither of them is a secret key.

1. Open the central project on supabase.com
2. Project Settings → API Keys
3. Copy the **Project URL** (`https://xxxxxxxx.supabase.co`)
4. Copy the **publishable key**, the one starting `sb_publishable_`

Do not use the key starting `sb_secret_`. That one can do anything to the
database and must never be in a website.

---

## Step 1. Run the one SQL file

Open the central project, go to **SQL Editor**, paste in
`sql/01_console_reads.sql`, press Run.

It adds one function, `list_adjustments`. The bonus and penalty table is
closed to everyone by design, and this is the single supervised way to read
it: the function checks on every call that the person asking is an organiser
or is asking about their own team.

Everything else the site needs already exists on central.

---

## Step 2. Run it on your own computer first

You need Node 18 or newer. Check with `node -v`.

```
npm install
cp .env.example .env.local
```

Open `.env.local` and paste in the two values from above. Then:

```
npm run dev
```

Open http://localhost:3000. You should see the board.

---

## Step 3. Get yourself in

Go to http://localhost:3000/enrol.

1. Choose **create one** and make an account with the email your enrolment
   code was issued to. It has to be that email or the code will not match.
2. You land on a screen asking for the code. Paste it in.
3. You are in. The console opens.

If it says the code is not valid, the usual cause is signing up with a
different email from the one the code was made for.

---

## Step 4. Put it online

The easiest host is Vercel, and it is free for this.

1. Push this folder to a **private** GitHub repository
2. vercel.com → Add New → Project → pick that repository
3. Before deploying, open **Environment Variables** and add the same two:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Then, back in the central Supabase project: **Authentication → URL
Configuration**, and add your Vercel address to the redirect list. Without
that, signing in on the live site can bounce people back out.

---

## What each page does

| Page | Who sees it | What it is for |
|---|---|---|
| `/` | anyone | The published board, the rules, the catalog |
| `/enrol` | anyone | Sign in, or redeem a code the first time |
| `/console` | organisers and leads | The live count, and what is waiting |
| `/console/review` | anyone who can approve | Open the proof, approve or reject |
| `/console/adjust` | anyone who can approve | Bonuses and penalties, and reversing them |
| `/console/publish` | anyone who can publish | Sign off a new public board |
| `/console/health` | organisers | Whether each team's feed is still reporting |

The menu only shows what a person is actually allowed to do. A team lead does
not see the publish page at all.

---

## Two things worth understanding

**The public board is a snapshot, not a running total.** It changes only when
someone presses publish. This is on purpose: every team's number moves at the
same moment, and nobody can sit watching a rival's total creep up. The console
shows the live count alongside the published one so you can always see the gap.

**The catalog on the public page is shipped with the site.** The point rules
live in `lib/catalog.ts`. The database table they came from is readable only
to signed-in people, and the public board has to work for someone with no
account. If a point rule ever changes in the database, that file needs
regenerating — it is the one place in this app that can drift out of date.

---

## Keyboard, on the review page

Harsh will have a lot of these to get through.

- `A` — approve the one in front of you and move to the next
- `J` / `K`, or the arrow keys — move up and down the queue

Rejecting or asking for more always needs a written reason. The team sees it,
and a rejection with no reason is the thing everyone argues about a week later.
