from flask import *
import requests
import json

app = Flask(__name__)

class Route():
    def __init__(self, id, route, origin, destination, start, end, stops, type_of_day, information):
        self.id = id
        self.route = route
        self.origin = origin
        self.destination = destination
        self.start = start
        self.end = end
        self.stops = stops
        self.type_of_day = type_of_day
        self.information = information

DAYS = {
    1: "WEEKDAY",

    2: "SATURDAY",

    3: "SUNDAY",
    }


def translate_website(lang):
    #TODO: Return dict with translations
    pass

def get_stops():
    response = requests.get('https://saomiguelbus-api.herokuapp.com/api/v1/stops')
    return json.loads(response.text) if response.status_code == 200 else []

def get_routes(origin, destination, day, time):
        URL = 'https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + origin + '&destination=' + destination + '&day=' + DAYS[day] + '&start=' + time
        response = requests.get(URL)
        return json.loads(response.text) if response.status_code == 200 else []



@app.route("/")
def home():
    return render_template('index.html', stops=get_stops())

@app.route("/index.html")
def index():
    routes = []

    origin = request.args.get('origin')
    destination = request.args.get('destination')
    day = int(request.args.get('day'))
    time = str(request.args.get('time').replace(":", "h"))

    response_routes = get_routes(origin, destination, day, time)
    for route in response_routes:
        information = json.loads(route['information'].replace("'", "\""))["en"] if route["information"] != "None" else ""
        routes.append(Route(route['id'], route['route'], route['origin'], route['destination'], route['start'], route['end'], json.loads(route['stops'].replace("'", "\"")), route['type_of_day'], information))
    routes.sort(key=lambda route: route.start)
    return render_template('index.html', stops=get_stops(), routes=routes, nRoutes=len(routes), origin=origin, destination=destination, day=day, time=time.replace("h", ":"))
    
if __name__ == '__main__':
   app.run()