from icalendar import Calendar
import requests

url = "http://www.formula1.com/calendar/Formula_1_Official_Calendar.ics"
c = Calendar.from_ical(requests.get(url).text)

print(c)
