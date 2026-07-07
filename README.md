<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# image-studio
Image Size Reducer & Editor is an offline-first image editing application that allows users to crop, resize, compress, and enhance images directly in the browser. The app provides tools for adjusting brightness, contrast, rotation, and image effects while maintaining high-quality output. Users can easily optimize images for sharing and storage.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages

1. Create a GitHub repository and push your local project to the `main` branch.
2. Add the workflow file at `.github/workflows/deploy-github-pages.yml`.
3. Push `main` to GitHub. GitHub Actions will build and publish `dist/` to GitHub Pages.
4. Enable Pages in repository Settings, and set the Pages source to the `gh-pages` branch if needed.

## Local build preview

1. Build the production site:
   `npm run build`
2. Preview locally:
   `npm run preview`
