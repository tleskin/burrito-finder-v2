# 🌯 BurritoFinder

**Find that perfect burrito no matter where you are.**

A ground-up rebuild of a 2015 [Turing School of Software & Design](http://turing.io/)
self-directed project. The [original](https://github.com/tleskin/burrito-finder)
was Ruby on Rails with Facebook login, the Yelp API, and Mapbox. This version keeps
the spirit and modernizes everything: Next.js + TypeScript + Tailwind, Yelp Fusion
via a server route, Leaflet + OpenStreetMap (no map token needed), and favorites
stored in your browser — no login, no database.

## Features

- 🔍 Search by city, neighborhood, or address — or use your current location
- 🗺️ Interactive map with burrito markers, synced with the results list
- ⭐ Ratings, review counts, price, distance, and Yelp links
- ❤️ Save favorites (persisted in localStorage, no account needed)
- 🎭 Demo mode: works out of the box with sample data until you add a Yelp key

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Leaflet · Yelp Fusion API

## Setup

1. **Get a Yelp API key** (free): [yelp.com/developers](https://www.yelp.com/developers)
   → Yelp Fusion → Create App. (Optional — without it you get fun demo data.)
2. Copy the env file and add your key:
   ```bash
   cp .env.example .env
   # edit .env and set YELP_API_KEY
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftleskin%2Fburrito-finder-v2)

> **Note:** this assumes the repo is published as `tleskin/burrito-finder-v2`.
> If you fork it, update the `repository-url` above to your fork.

After deploying, add `YELP_API_KEY` in the project’s Environment Variables
(no key = demo data). No database needed.

## Deploy with Docker

```bash
docker build -t burrito-finder .
docker run -p 3000:3000 -e YELP_API_KEY=your_key_here burrito-finder
```

## License

MIT © 2026 Tom Leskin. See [LICENSE](LICENSE).
