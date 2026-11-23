# Put StudyCircle on the web (Render, free)

You'll end up with two links for Canvas: the **hosted site** and the **GitHub repo**.

## 1. Put the code on GitHub
1. Create an account at https://github.com, then **New repository** (name it `studycircle`, keep it Public so your instructor can open it).
2. In the project folder in a terminal:
   ```
   git init
   git add .
   git commit -m "StudyCircle final project"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/studycircle.git
   git push -u origin main
   ```
   (`node_modules`, `dist` and `server/data` are already ignored, so they won't be uploaded.)

## 2. Host it on Render
1. Sign up at https://render.com with your GitHub account.
2. **New → Blueprint**, choose your `studycircle` repo, and click **Apply**.
   Render reads `render.yaml` and sets everything up (build, start command, secret key).
   *(No Blueprint option? Use **New → Web Service** instead: Build Command `npm install && npm run build`,
   Start Command `npm run start:server`, and add environment variables `TRUST_PROXY=1` and `JWT_SECRET=<any long random text>`.)*
3. Wait for the first deploy (a few minutes). Your link looks like `https://studycircle-xxxx.onrender.com`.
4. Open it and click **Try the demo**, or log in with `alex@school.edu` / `demo1234`.

## 3. Things to know
- **Free plan sleeps** after ~15 minutes of no visits. The first visit afterwards takes ~30–60 seconds. Open the link yourself a minute before presenting or being graded.
- **Free plan resets the database** whenever the service restarts or redeploys: accounts you created disappear and the sample data comes back. The demo account always works. For permanent data, use a paid plan with a disk (see `render.yaml`).
- Every `git push` to `main` redeploys automatically.
- The sample accounts (`alex@school.edu` / `demo1234`, and `ana@school.edu`, etc. / `password123`) exist on the public site, so don't use real passwords with them.

## 4. Submit on Canvas
Paste both links into the submission box:
- Hosted project: your `https://….onrender.com` link
- Source code: your `https://github.com/YOUR-USERNAME/studycircle` link

## Other hosts
Anything that runs Node 20+ works: build with `npm install && npm run build`, start with `npm run start:server`,
and set `TRUST_PROXY=1`, `JWT_SECRET`, and (if the host gives you a persistent disk) `DATA_DIR`.
