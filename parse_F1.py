from icalendar import Calendar
import requests
import datetime
import json

import re
from pprint import pprint
from typing import List


def uncursed(v_text) -> str:
    "This should fix the text encoding"
    return v_text.encode('latin1').decode('utf8')

def download_sessions(url : str) -> List[dict]:

    cal = Calendar.from_ical(requests.get(url).text)

    events = []

    for event in cal.walk('vevent'):
        if str(event["STATUS"]) != "CONFIRMED":
            continue

        start = event["DTSTART"].dt
        finish = event["DTEND"].dt
        session_name =  re.search(r" (?:-|–) (.*)$", uncursed(event["SUMMARY"])).group(1) # This should uncurse the decoding
        grand_prix_name = re.search(r"Learn more about the (.* Grand Prix|Pre-Season Test)\.", uncursed(event["DESCRIPTION"])).group(1)

        events.append({
            "grand_prix_name" : grand_prix_name, 
            "session_name" : session_name, 
            "start"  : start, 
            "finish" : finish,
        })
    
    return events

def to_json(events : List[dict]) -> dict:
    res = {
        "name": "Formula 1"
    }

    for event in events:
        grand_prix_name = event["grand_prix_name"]
        session_name    = event["session_name"]

        if grand_prix_name not in res:
            res[grand_prix_name] = {}
        res[grand_prix_name][session_name] = {
            "start"  : event["start"].isoformat(), 
            "finish" : event["finish"].isoformat(),
        }

    return res

if __name__ == "__main__":
    url = "http://www.formula1.com/calendar/Formula_1_Official_Calendar.ics"
    events = download_sessions(url)

    with open('data/F1.json', 'w') as file:
        json.dump(to_json(events), file)
