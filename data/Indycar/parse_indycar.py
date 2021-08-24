from bs4 import BeautifulSoup
import requests
import datetime
import pathlib
import re
import pytz
import json
from pprint import pprint

def get_races_urls():
    CALENDAR_URL = "https://www.indycar.com/Schedule"
    soup = BeautifulSoup(requests.get(CALENDAR_URL).text, 'html.parser')

    return ["https://www.indycar.com" + a["href"] for a in soup.find_all("a", {"class" : "schedule-list__title"})]

def parse_race_event_page(url) -> dict:
    print(f"Parsing {url}...")
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')

    title = soup.find("div", {"class" :  "title-container"}).find("h2").text.strip()
    
    res = {title : {}}

    for row in soup.find("div", {"class" : "race-list"}).find_all("div", {"class" : "race-list__item"}):
        date = parse_day(row)
        start, finish = parse_time_span(row, date)
        series, session = parse_race_session(row)
        
        if series == "NTT INDYCAR SERIES":
            res[title][session] = {
                "start"  : start.isoformat(),
                "finish" : finish.isoformat()
            }

    return res

def parse_day(row):
    date  = row.find_next("div", {"class" : "race-list__date"}).contents[0]
    match = re.search(r".*,\s*(\w*) (\d*)", date)
    month = parse_abbreviated_month(match.group(1))
    day   = int(match.group(2))
    year  = datetime.datetime.now().year # This shouldn't be problematic, given how Indycar schedule their races
    return datetime.date(year, month, day)
    
def parse_time_span(row, date : datetime.date):
    time = row.find_next("div", {"class" : "race-list__time"}).contents[0]
    match = re.search(r"(\d{1,2}:\d{1,2} \w{1,2})\s*-\s*(\d{1,2}:\d{1,2} \w{1,2})", time)
    print(time, f"|{match.group(1)}|", f"|{match.group(2)}|")
    start  = datetime.datetime.strptime(match.group(1), "%I:%M %p").replace(date.year, date.month, date.day)
    finish = datetime.datetime.strptime(match.group(2), "%I:%M %p").replace(date.year, date.month, date.day)

    eastern = pytz.timezone('US/Eastern')
    return eastern.localize(start), eastern.localize(finish)

def parse_race_session(row):
    race = row.find_next("div", {"class" : "race-list__race"}).contents[0]
    match = re.search(r"(.*) - (.*)", race)
    if match == None:
        return "NTT INDYCAR SERIES", race
    else:
        return match.group(1), match.group(2)

# https://www.kite.com/python/answers/how-to-convert-between-month-name-and-month-number-in-python
def parse_abbreviated_month(month):
    return datetime.datetime.strptime(month, "%b").month

if __name__ == "__main__":
    file_path = pathlib.Path(__file__).parent / 'Indycar.json'
    races_urls = get_races_urls()
    print("Found the following urls:")
    pprint(races_urls)

    res = {"name" : "Indycar"}

    for url in races_urls:
        res.update(parse_race_event_page(url))
    
    with open(file_path, 'w') as file:
        json.dump(res, file)