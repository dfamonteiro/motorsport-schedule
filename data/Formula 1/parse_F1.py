from bs4 import BeautifulSoup
import requests
import datetime
import pathlib
import re
import json
from pprint import pprint

def get_races_urls():
    CALENDAR_URL = f"https://www.formula1.com/en/racing/{datetime.date.today().year}.html"
    soup = BeautifulSoup(requests.get(CALENDAR_URL).text, 'html.parser')

    res = []
    for a in soup.find("div", {"class" : "current-listing"}).find_all("a"):
        if f"/en/racing/{datetime.date.today().year}" in a["href"] and "TBC" not in a["href"]:
            res.append(
                "https://www.formula1.com" + a["href"]
            )
    return res

def parse_race_event_page(url) -> dict:
    print(f"Parsing {url}...")
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')

    webpage_title = soup.find("meta", {"property" : "og:title"})["content"]
    
    try:
        GP_name = re.search(r"^(.+(?:Testing|Prix))", webpage_title).group(1)
    except AttributeError:
        GP_name = webpage_title

    res = {GP_name : {}}

    event_divs = soup.find("div", {"class" : "f1-race-hub--timetable-listings"}).children

    for event_div in event_divs:
        if event_div == "\n":
            continue

        session_name = event_div.find_next("p", {"class" : "f1-timetable--title"}).contents[0]
        offset = event_div["data-gmt-offset"]
        start = event_div["data-start-time"]
        finish = event_div["data-end-time"]
        
        if "TBC" in start:
            continue

        res[GP_name][session_name] = {
            "start"  : start + offset,
            "finish" : finish + offset
        }

    return res

if __name__ == "__main__":
    file_path = pathlib.Path(__file__).parent / 'Formula 1.json'
    races_urls = get_races_urls()
    print("Found the following urls:")
    pprint(races_urls)

    res = {}

    for url in races_urls:
        res.update(parse_race_event_page(url))        
    
    with open(file_path, 'w') as file:
        json.dump(res, file)