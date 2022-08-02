from flask import *
import requests
import json

app = Flask(__name__)

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
        routes = json.loads(response.text)
        for route in routes:
            print (route)
    return render_template('index.html')

if __name__ == '__main__':
   app.run()