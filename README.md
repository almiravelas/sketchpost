# Parcel Post: commission tracking for artists

Any artist can sign up with Google and get their own studio. In the studio they can customize how their pages look and create as many parcels (commission tracking pages) as they like. Each parcel has a private link to send to the client.

| Page | Who it's for | What it does |
|---|---|---|
| `/` | Everyone | Landing page: explains Parcel Post, has a "Start your studio with Google" button, and a box for clients to enter a tracking number |
| `/studio` | Artists | Sign in with Google → set up studio → list of all your parcels (search + filters) → open one to edit stages, notes and proofs → **Customize** your colors, headline, logo stamp, tracking prefix, thank-you note and default stages |
| `/t/XX-XXXX-XXXX` | Clients | One parcel, view-only, in the artist's own colors and branding. Updates live. |

It's a plain static site (no build step), hosted on Vercel, with Firebase for Google sign-in and the database. It runs on Firebase's free Spark plan, so no billing account is needed.

## 1. Set up Firebase (about 10 minutes)

1. Go to <https://console.firebase.google.com> → **Create a project** (Google Analytics is optional).
2. **Add a web app**: Project overview → the `</>` icon → give it a name → **Register app**. Copy the `firebaseConfig` values into `assets/firebase-config.js`.
3. **Turn on Google sign-in**: Build → Authentication → Get started → Sign-in method → Google → Enable → Save.
4. **Create the database**: Build → Firestore Database → Create database → choose a location (e.g. `asia-southeast1`, Singapore) → start in **production mode**.
5. **Add the security rules**: Firestore Database → Rules → replace everything with the contents of `firestore.rules` → **Publish**.

## 2. Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. On <https://vercel.com> → **Add New… → Project** → import the repo.
3. Framework preset: **Other**. Leave the build command and output directory empty. Click **Deploy**.
4. Back in Firebase → Authentication → **Settings → Authorized domains** → **Add domain** → your Vercel domain (e.g. `parcel-post.vercel.app`, plus any custom domain later). Google sign-in won't work until you do this.

Vercel redeploys automatically every time you push to GitHub.

## How access works

- **Artists** can only see, edit and delete parcels they created. Signing in gives each artist their own studio; nobody can open another artist's studio or list their parcels.
- **Clients** don't sign in. With a tracking link they can view that one parcel, its proofs, and the artist's public studio look (name, handle, colors). Tracking numbers are random, so they can't be guessed or listed.
- All of this is enforced by `firestore.rules` on Google's servers, not by hiding pages.

## Limits to keep an eye on

All artists share your one Firebase project, and the free plan includes:

- **1 GiB of stored data.** Proof images are compressed in the browser to about 330 KB each and saved in Firestore, so roughly 2,500–3,000 proofs fit across all artists. Artists can paste image links instead to save space.
- **50,000 document reads and 20,000 writes per day**, plus **10 GiB of downloads per month.** Each client visit reads the parcel, the artist's profile and that parcel's proofs.

If Parcel Post grows past that, the next step is moving proof images to Firebase Storage or Cloudinary. Both are outside the free Spark plan's limits.

## Previewing locally

Run `npx vercel dev` in this folder. Before `firebase-config.js` is filled in, the landing and tracking pages show a sample parcel and the studio shows setup instructions.

## Files

```
index.html                landing page (artist sign-up + tracking lookup)
studio.html               artist studio (sign-in required)
track.html                client tracking page
assets/style.css          all styling (themeable with CSS variables)
assets/ui.js              shared stamps, postmarks, route, themes, lightbox
assets/landing.js         landing page logic
assets/studio.js          studio: onboarding, parcel list, editor, customize
assets/track.js           client page logic
assets/firebase.js        Firebase setup
assets/firebase-config.js ← paste your Firebase config here
firestore.rules           database security rules (paste into Firebase)
vercel.json               routes: /t/CODE → track.html, /studio → studio.html
```

© 2026 Almira Velasquez aka sigbinnie
