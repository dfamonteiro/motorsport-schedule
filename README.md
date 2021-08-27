# Motorsport Countdown

## How does the website work?

The first JSON file that is loaded by `main.js` will be `data/series.json`:

```json
{
  "Formula 1": {
    "short": "F1", // Short version of the name
    "background": "#e10600", // Background color
    "color": "#fff", // Font color
    "file path": "Formula 1/Formula 1.json" // Path to the session data
  },
  "Formula 2": {
    "short": "F2",
    "background": "#0090D0",
    "color": "#fff",
    "file path": "Formula 23/Formula 2.json"
  },
  ...
}
```

For every series in the file, their respective JSON file (i.e. `"file path"`) will be loaded, which looks something like this:

```json
{
    "name": "Formula 1",
    "Bahrain Grand Prix": {
        "Practice 1": {
            "start": "2021-03-26T11:30:00+00:00",
            "finish": "2021-03-26T12:30:00+00:00"
        },
        "Practice 2": {
            "start": "2021-03-26T15:00:00+00:00",
            "finish": "2021-03-26T16:00:00+00:00"
        },
        "Practice 3": {
            "start": "2021-03-27T12:00:00+00:00",
            "finish": "2021-03-27T13:00:00+00:00"
        },
        "Qualifying": {
            "start": "2021-03-27T15:00:00+00:00",
            "finish": "2021-03-27T16:00:00+00:00"
        },
        "Race": {
            "start": "2021-03-28T16:00:00+01:00",
            "finish": "2021-03-28T18:00:00+01:00"
        }
    },
    "Emilia Romagna Grand Prix": {
        "Practice 1": {
            "start": "2021-04-16T10:00:00+01:00",
            "finish": "2021-04-16T11:00:00+01:00"
        },
        ...
    },
    ...
}
```

The sessions in those files are then processed and sorted into days:

```json
{
    "2021-10-01": {
        "Formula 1": {
            "name": "Pre-Season Test",
            "sessions": {
                "Practice 1": {
                    "start": "2021-10-01T10:30:00+01:00",
                    "finish": "2021-10-01T11:30:00+01:00"
                },
                "Practice 2": {
                    "start": "2021-10-01T14:00:00+01:00",
                    "finish": "2021-10-01T15:00:00+01:00"
                }
            }
        },
        "MotoGP": {
            "name": "MotoGP Red Bull Grand Prix of the Americas",
            "sessions": {
                "Free Practice Nr. 1": {
                    "start": "2021-10-01T09:55:00-0500",
                    "finish": "2021-10-01T10:40:00-0500"
                },
                "Free Practice Nr. 2": {
                    "start": "2021-10-01T14:10:00-0500",
                    "finish": "2021-10-01T14:55:00-0500"
                }
            }
        },
        ...
    },
    "2021-10-08": {
        ...
    },
    ...
}
```

## Run these commands to set up your environment

```bash
source bin/activate
python3 -m pip install -r requirements.txt
```
