# Foos Rating System Prototype Backend

## Dependencies

This repository was developed on Python 3.12.9. It is recommended to use a
virtual environment before installing the required libraries.

```sh
python3 -m pip install -r requirements.txt
```

This will install the libraries used for analysis, API creation, and DB
communication.

## Run `dev` Server

First, set up `.env` with

- `DB_URL` set to the URL of the Postgres database
- `ORIGINS` set to the originating URL(s) to allow access to. Can be a multiline
string. Use `"*"` to allow all access during development.

```sh
fastapi dev service.py
```

## Local Dataset Operations

Requires a CSV file, e.g. `games.csv`, with at least the following columns:

- `yellow_front` (string)
- `yellow_back` (string)
- `yellow_score` (int)
- `black_front` (int)
- `black_back` (string)
- `black_score` (string)

### Manually Populate Database with Spreadsheet

```sh
python populatedb.py {path/to/games.csv}
```

This script will truncate the DB tables and repopulate the tables with the data
in the provided spreadsheet.

### Dry Timeseries Run

```sh
python3 dry.py {path/to/games.csv}
```

This script will print the final ratings of all players after simulating the
deltas of each game applied in order from top to bottom.

## TODOs

- [ ] Write tests for everything :P
- [ ] Use better color generator for player names for contrast against
background and each other
- [ ] Better CRUD operations for games and players
- [ ] Better error handling
