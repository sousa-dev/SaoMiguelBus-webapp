from flask import *
#from flask_talisman import Talisman
import requests
import json
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(16)

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
        self.stop_time = self.stops[origin]

DAYS = {
    1: "WEEKDAY",

    2: "SATURDAY",

    3: "SUNDAY",
    }

LANGS = {
    'en': {
        'website_title': 'São Miguel Bus',
        'title': 'Search a Bus',
        'subtitle': 'Find the best bus for you.',
        'From': 'From',
        'To': 'To',
        'From_placeholder': 'Type your origin...',
        'To_placeholder': 'Type your destination...',
        'Day': 'Day Of the Week',
        'Weekday': 'Weekday',
        'Saturday': 'Saturday',
        'Sunday': 'Sunday/Holiday',
        'Time': 'What Time?',
        'Optional': 'Optional',
        'Search': 'Search for a Bus',
        'warning': 'Only direct routes are shown',
        'No_routes1': 'No routes found from',
        "No_routes2": "to",
        'No_routes_subtitle': 'Please be careful with the spelling. Choose one Stop from the options displayed.',
        'Search_menu': 'Search',
        'Contact': 'Contact',
        'card_title': 'Get In Touch',
        'contact_title': 'Found anything wrong?',
        'contact_subtitle': 'We\'re open for any suggestion or just to have a chat',
        'contact_name': 'Name',
        'contact_email': 'Email',
        'contact_subject': 'Subject',
        'contact_message': 'Message',
        'contact_button': 'Send Message Now',
        'support': "Support the",
        'support_bold': "Developer",
        'route_warning': 'Information taken from public sources provided by bus companies',
        'info_warning': "This website is not affiliated with any company or organization. The present schedule was taken from public documents made available by the bus companies. Some routes/hours may be outdated!",
    },
    'pt': {
        'website_title': 'Autocarros São Miguel',
        'title': 'Procura um Autocarro',
        'subtitle': 'Encontra a melhor rota para ti.',
        'From': 'Partida',
        'To': 'Destino',
        'From_placeholder': 'Escolhe o teu ponto de partida...',
        'To_placeholder': 'Escolhe o teu destino...',
        'Day': 'Dia da Semana',
        'Weekday': 'Dia útil',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo/Feriado',
        'Time': 'A que horas?',
        'Optional': 'Opcional',
        'Search': 'Pesquisar autocarros',
        'warning': 'Apenas são apresentadas rotas diretas',
        'No_routes1': 'Não foram encontradas rotas entre',
        "No_routes2": "e",
        'No_routes_subtitle': 'Verifica se as paragens estão corretamente escritas ou escolhe uma das opções apresentadas.',
        'Search_menu': 'Pesquisar',
        'Contact': 'Contatar',
        'card_title': 'Entre em contato',
        'contact_title': 'Encontrou algo errado?',
        'contact_subtitle': 'Estamos abertos para qualquer sugestão ou apenas para conversar',
        'contact_name': 'Nome',
        'contact_email': 'Email',
        'contact_subject': 'Assunto',
        'contact_message': 'Mensagem',
        'contact_button': 'Enviar Mensagem',
        'support': "Apoia o",
        'support_bold': "Criador",
        'route_warning': 'Informação retirada de fontes públicas disponibilizadas pelas empresas de autocarros',
        "info_warning": "Este site não é afiliado a nenhuma empresa ou organização. O horário usado foi retirado de documentos públicos disponibilizados pelas empresas de autocarros. Alguns horários podem estar desatualizados!"
    }
}

def format_stops(origin, destination):
    new_origin = ""
    for word in origin.split():
        new_origin += " " + word.capitalize() if word.lower() != "do" and word.lower() != "da" and word.lower() != "de" and word.lower() != "dos" and word.lower() != "das" else " " + word.lower()
    new_destination = ""
    for word in destination.split():
        new_destination += " " + word.capitalize() if word.lower() != "do" and word.lower() != "da" and word.lower() != "de" and word.lower() != "dos" and word.lower() != "das" else " " + word.lower()
    return new_origin.strip(), new_destination.strip()


def get_stops():
    try:
        response = requests.get('https://saomiguelbus-api.herokuapp.com/api/v1/stops')
    except Exception as e:
        print(e)
        return None
    return json.loads(response.text) if response.status_code == 200 else []

def get_routes(origin, destination, day, time):
        URL = 'https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + origin.replace('ç', 'c') + '&destination=' + destination.replace('ç', 'c') + '&day=' + DAYS[day] + '&start=' + time
        try:
            response = requests.get(URL)
        except Exception as e:
            print(e)
            return []
        try:
            post = requests.post(f"https://saomiguelbus-api.herokuapp.com/api/v1/stat?request=get_route&origin={origin}&destination={destination}&time={time}&language={session.get('lang', 'pt')}&platform=web&day={DAYS[day]}")
            print(post.status_code)
            print(f"https://saomiguelbus-api.herokuapp.com/api/v1/stat?request=get_route&origin={origin}&destination={destination}&time={time}&language={session.get('lang', 'pt')}&platform=web&day={DAYS[day]}")
        except Exception as e:
            print(e)
        return json.loads(response.text) if response.status_code == 200 else []



@app.route("/")
def home():
    change_lang = request.args.get('lang', '')
    if change_lang != '':
        session['lang'] = change_lang
    return render_template('index.html', stops=get_stops(), attr = LANGS[session.get('lang', 'pt')], lang = session.get('lang', 'pt'))

@app.route("/index.html")
def index():
    routes = []

    change_lang = request.args.get('lang', '')
    if change_lang != '':
        session['lang'] = change_lang

    lang = session.get('lang', 'pt')
    
    origin = request.args.get('origin', default = "Origin")
    destination = request.args.get('destination', default = "Destination")
    day = int(request.args.get('day', default = 1))
    time = str(request.args.get('time', default = "00:00").replace(":", "h"))

    origin, destination = format_stops(origin, destination)
    response_routes = get_routes(origin, destination, day, time)
    for route in response_routes:
        information = json.loads(route['information'].replace("'", "\""))[lang] if route["information"] != "None" else ""
        stops = json.loads(route['stops'].replace("'", "\""))
        if origin in stops and destination in stops:
            routes.append(Route(route['id'], route['route'], route['origin'], route['destination'], route['start'], route['end'], stops, route['type_of_day'], information))
    routes.sort(key=lambda route: route.stop_time)
    return render_template('index.html', stops=get_stops(), routes=routes, nRoutes=len(routes), origin=origin, destination=destination, day=day, time=time.replace("h", ":"), attr = LANGS[lang], lang = lang, anchor='tm-section-search')

@app.route("/sw.js")
def propellerads():
    resp = make_response(render_template('sw.js'))
    resp.mimetype = 'text/plain'
    return resp 

@app.errorhandler(Exception)
def page_not_found(e):
    print(e)
    return render_template('error.html') 

#Talisman(app, content_security_policy=None)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=False)
