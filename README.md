# Certify

An independent credential verification platform. Visitors choose an issuing
organization, enter a certificate number and the holder's full name, and Certify
returns the original certificate image — held on file as a trusted third party.

- **Frontend** — Vanilla HTML / CSS / JavaScript (no build step)
- **Database** — Supabase (Postgres + RLS)
- **Image storage** — Cloudinary (URLs only)
- **Hosting** — Cloudflare Pages

---

## Project layout

```
.
├── index.html      Landing page + verification modal
├── admin.html      PIN-gated admin console
├── style.css       Design system + components
├── app.js          Landing-page logic (slider, scroll fades, verification)
├── admin.js        Admin CRUD logic
├── supabase.js     Supabase client (drop your credentials here)
├── schema.sql      Database schema + RLS policies
└── README.md       This file
```

---

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste the contents of `schema.sql` and run it. This creates
   the `organizations` and `certificates` tables, an index on `(organization_id,
   certificate_number)`, and Row Level Security policies (public read; writes
   open in this build — see *Hardening* below).
3. In **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** API key
4. Open `supabase.js` and replace the two placeholder strings.

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

> The anon key is safe to ship in client-side code. RLS policies decide what it
> can do.

---

## 2. Set up Cloudinary

Certify stores certificate images on Cloudinary and references them by URL — no
client-side uploads.

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Upload each certificate image (PNG/JPG/PDF render) through the Cloudinary
   media library.
3. Copy the **Secure delivery URL** for each upload (looks like
   `https://res.cloudinary.com/<cloud>/image/upload/v.../filename.png`).
4. Paste the URL into the **Cloudinary image URL** field when adding a
   certificate in the admin console.

You can apply Cloudinary transformations in the URL (e.g. `…/upload/q_auto,f_auto/…`)
to optimize delivery.

---

## 3. Run locally

The site is fully static — any local server will do.

```bash
# Option A
npx serve .

# Option B
python -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173) (or whichever port your
server prints).

---

## 4. Use the admin console

- Open the site, scroll to the footer, and click **Admin** (or triple-click the
  Certify logo in the top-left).
- Enter PIN `1911`.
- The console has two tabs:
  - **Organizations** — add, view, and delete partner issuers.
  - **Certificates** — pick an organization, then add a record by pasting the
    certificate number, the holder's full name, and the Cloudinary URL.

End-to-end smoke test:

1. Add one organization (e.g. *Northbridge Institute*).
2. Add one certificate under it (e.g. number `CT-19-44081`, holder
   `Alex M. Carter`, with a Cloudinary image URL).
3. Return to the homepage, click **Verify Certificate**, pick the
   organization, enter the same number and name → the certificate image should
   render with a green *Verified Authentic* banner.
4. Repeat with a wrong name → expect the soft red *Certificate not found* state.

---

## 5. Deploy to Cloudflare Pages

1. Push the repository to GitHub (or GitLab / Bitbucket).
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages →
   Connect to Git** and pick the repo.
3. Build settings:
   - **Framework preset:** *None*
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. The first build publishes the static files
   directly.

To roll a new version, push to your default branch — Pages rebuilds
automatically.

---

## Hardening (recommended before going live)

The included RLS policies leave `insert/update/delete` open to the anon key so
the admin console works out of the box. Before exposing the admin URL beyond
trusted operators, choose one of:

- **Service-role pattern** — restrict writes to `service_role` and proxy the
  admin console through a small Cloudflare Worker that holds the service key.
- **Auth pattern** — require a Supabase auth user on the admin page and gate
  policies with `auth.uid() is not null`.

Then update `schema.sql` to drop the `*_anon_write` policies.

---

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). The site uses native
ES modules, `IntersectionObserver`, and CSS Grid.
