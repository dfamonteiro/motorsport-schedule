from ics import Calendar
import requests

url = "https://www.formula1.com/calendar/Formula_1_Official_Calendar.ics"
c = Calendar(requests.get(url).text)

print(c)