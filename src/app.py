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

@app.route("/")
def home():
    return render_template('index.html')

@app.route("/index.html")
def index():
    routes = []

    origin = request.args.get('origin')
    destination = request.args.get('destination')
    day = int(request.args.get('day'))
    time = request.args.get('time')
    response = requests.get('https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + origin + '&destination=' + destination + '&day=' + DAYS[day] + '&time=' + time)
    #TODO: check status code
    if response.status_code == 200:
        response_routes = json.loads(response.text)
        for route in response_routes:
            routes.append(Route(route['id'], route['route'], route['origin'], route['destination'], route['start'], route['end'], route['stops'], route['type_of_day'], route['information']))
    print(routes)
    return render_template('index.html', routes=routes)

if __name__ == '__main__':
   app.run()