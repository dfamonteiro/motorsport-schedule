from bs4 import BeautifulSoup
import requests
import datetime
import pathlib
import re
import pytz
import json
from dateutil import parser
import typing
from pprint import pprint

def get_races_urls() -> typing.List[typing.Tuple[str, str]]:
    CALENDAR_URL = "https://www.motogp.com/en/calendar"
    soup = BeautifulSoup(requests.get(CALENDAR_URL).text, 'html.parser')

    event_divs = soup.find("div", {"class" : "calendar_events"}).find_all("div", {"class" : "event_container"})

    urls = []

    for div in event_divs:
        if "hidden" in div["class"]:
            continue
        title = div.find_next("a", {"class" : "event_name"})
        url = title["href"]
        GP_name = re.search(r"\d*\s*-\s*(.*)", title.contents[0].strip()).group(1)
        urls.append((url, GP_name))

    return urls

def parse_race_event_page(url, GP_name) -> typing.Tuple[dict, dict, dict, dict]:
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')

    schedule_div = soup.find("div", {"class" : "c-event__schedule"})
    
    day_schedule_divs = schedule_div.find_all("div", {"class" : "c-schedule__table-container"})

    res = {
        "MotoGP" : {GP_name : {}},
        "Moto2"  : {GP_name : {}},
        "Moto3"  : {GP_name : {}},
        "MotoE"  : {GP_name : {}},
    }

    for schedule_div in day_schedule_divs:
        rows = schedule_div.find_all_next("div", {"class" : "c-schedule__table-row"})
        for row in rows:
            time_span_div = row.find_next("div", {"class" : "c-schedule__time"})

            start   = time_span_div.find_all("span")[0]["data-ini-time"]
            try:
                finish  = time_span_div.find_all("span")[1]["data-end"]
            except IndexError:
                finish_datetime = parser.parse(start) + datetime.timedelta(hours=1)
                finish = finish_datetime.isoformat()

            series  = row.find_all_next("div", {"class" : "c-schedule__table-cell"})[1].contents[0].strip()
            session = row.find_all_next("div", {"class" : "c-schedule__table-cell"})[2].find_next("span").contents[0]

            if not any(map(lambda valid_session: valid_session in session.split(), ["Practice", "Qualifying", "Race", "E-Pole"])):
                continue
            if "Press" in session.split():
                continue

            res[series][GP_name][session] = {
                "start"  : start,
                "finish" : finish,
            }
    
    if len(res["MotoE"][GP_name]) == 0:
        res["MotoE"] = {}            

    return res["MotoGP"], res["Moto2"], res["Moto3"], res["MotoE"]

if __name__ == "__main__":
    motoGP_path = pathlib.Path(__file__).parent / 'MotoGP.json'
    moto2_path  = pathlib.Path(__file__).parent / 'Moto2.json'
    moto3_path  = pathlib.Path(__file__).parent / 'Moto3.json'
    motoE_path  = pathlib.Path(__file__).parent / 'MotoE.json'

    races_urls = get_races_urls()
    print("Found the following urls:")
    pprint([url[0] for url in races_urls])

    motoGP_res = {"name" : "MotoGP"}
    moto2_res  = {"name" : "Moto2"}
    moto3_res  = {"name" : "Moto3"}
    motoE_res  = {"name" : "MotoE"}

    for url in races_urls:
        print(f"Parsing {url}...")
        motoGP, moto2, moto3, motoE = parse_race_event_page(*url)
        motoGP_res.update(motoGP)
        moto2_res.update(moto2)
        moto3_res.update(moto3)
        motoE_res.update(motoE)
    
    with open(motoGP_path, 'w') as file:
        json.dump(motoGP_res, file)

    with open(moto2_path, 'w') as file:
        json.dump(moto2_res, file)

    with open(moto3_path, 'w') as file:
        json.dump(moto3_res, file)

    with open(motoE_path, 'w') as file:
        json.dump(motoE_res, file)