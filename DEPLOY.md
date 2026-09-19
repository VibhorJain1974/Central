# Putting AARVAK CENTRAL online

Run these in `D:\aarvak-central-app`, in a terminal.

## 1. Deploy

```
npx vercel --prod
```

First time it asks a few things. Answer like this:

- Set up and deploy? **y**
- Which scope? **vibhorjain1974's projects**
- Link to existing project? **n**
- Project name? **aarvak-central**
- In which directory is your code? **press Enter**
- Modify settings? **n**

It builds and gives you a URL. The site is live at that point, but the
database is not connected yet, so it will look broken. Step 2 fixes that.

## 2. Give it the two keys

```
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
```
Paste: `https://maekkuqaazfjujtokobl.supabase.co`

```
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```
Paste your central publishable key, the one starting `sb_publishable_`.
It is in your `.env.local` file already.

Do both again with `preview` instead of `production` if you want preview
builds to work too.

## 3. Deploy again so the keys take effect

```
npx vercel --prod
```

## 4. Tell Supabase about the new address

Central Supabase project, **Authentication**, **URL Configuration**. Add your
new Vercel address to **Redirect URLs**. Without this, signing in on the live
site bounces people straight back out.

---

## After this

Once the project exists I can deploy updates for you directly, no commands.
Just say the word.
