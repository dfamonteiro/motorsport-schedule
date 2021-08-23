from bs4 import BeautifulSoup
import requests
import json
import pathlib

def download_sessions() -> dict:
    CALENDAR_URL = "https://www.fiaformula2.com/Calendar"
    soup = BeautifulSoup(requests.get(CALENDAR_URL).text, 'html.parser')

    data = json.loads(soup.find("script", {"id" : "__NEXT_DATA__"}).contents[0])

    races = data["props"]["pageProps"]["pageData"]["Races"]

    res = {"name" : "Formula 2"}

    for race in races:
        res.update(trim_event_data(race))
    
    return res

def trim_event_data(event_json : dict) -> dict:
    key = event_json["CountryName"]
    res = { key : {}}

    for session in event_json["Sessions"]:
        res[key][session["SessionName"]] = {
            "start":  session["SessionStartTime"],
            "finish": session["SessionEndTime"]
        }
    
    return res

if __name__ == "__main__":
    file_path = pathlib.Path(__file__).parent / 'Formula 2.json'

    with open(file_path, 'w') as file:
        json.dump(download_sessions(), file)