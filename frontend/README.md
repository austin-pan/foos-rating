# Simple Website for Foos Ratings

## Run `dev` website

First, set up `.env` with

- `VITE_API_URL` to the URL where the backend service
is running.

Then, to run React website:

```sh
npm install
npm run dev
```

## Current features

1. Leaderboard
2. Ratings graph
3. Match history of last 20 games
4. Recording games

## TODOs

- [ ] Cycle through which players are shown on the graph
- [ ] Allow filtering of players shown in graph
- [ ] Better CRUD operations for games and players
- [ ] Make match history paginated
- [ ] Make styling of everything better, e.g. colors, fonts, layout, etc.
- [ ] Better error messages/handling
