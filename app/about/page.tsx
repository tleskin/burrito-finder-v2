import Link from "next/link";

export const metadata = {
  title: "About · BurritoFinder",
  description: "About the BurritoFinder rebuild.",
};

export default function About() {
  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-orange-50 to-stone-100">
      <header className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <Link href="/" className="text-2xl font-black tracking-tight text-stone-900">
          🌯 BurritoFinder
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-white/80 p-8 shadow-sm sm:p-10">
          <p className="text-5xl" aria-hidden>
            🌯
          </p>
          <h1 className="mt-4 text-3xl font-black text-stone-900">About</h1>
          <div className="mt-4 space-y-4 text-stone-700">
            <p>
              BurritoFinder started life in 2015 as a self-directed project at the{" "}
              <a
                href="http://turing.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-700 underline-offset-2 hover:underline"
              >
                Turing School of Software &amp; Design
              </a>
              . The original was a Ruby on Rails app that logged you in with
              Facebook, searched the Yelp API for burritos near you, plotted them
              on a Mapbox map, and let you save favorites.
            </p>
            <p>
              This is a ground-up rebuild with modern tools — Next.js, TypeScript,
              and Leaflet with OpenStreetMap — keeping the same spirit:{" "}
              <em>find that perfect burrito no matter where you are.</em> No login
              this time; your favorites live in your browser.
            </p>
            <p>
              The original Rails code is preserved for posterity at{" "}
              <a
                href="https://github.com/tleskin/burrito-finder"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-700 underline-offset-2 hover:underline"
              >
                github.com/tleskin/burrito-finder
              </a>
              .
            </p>
          </div>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-amber-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            ← Find burritos
          </Link>
        </div>
      </main>
    </div>
  );
}
