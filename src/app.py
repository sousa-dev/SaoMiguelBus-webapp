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

LOCAL_DB = {
    'Ponta Garça:Vila Franca:WEEKDAY': '[{"id": 2566, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "06h40", "end": "07h05", "stops": "{\'Ponta Gar\u00e7a\': \'06h40\', \'Caminho Novo\': \'06h45\', \'Ribeira das Tainhas\': \'06h55\', \'Vila Franca\': \'07h05\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2567, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "07h50", "end": "08h15", "stops": "{\'Ponta Gar\u00e7a\': \'07h50\', \'Caminho Novo\': \'07h55\', \'Ribeira das Tainhas\': \'08h05\', \'Vila Franca\': \'08h15\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2568, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "09h10", "end": "09h35", "stops": "{\'Ponta Gar\u00e7a\': \'09h10\', \'Caminho Novo\': \'09h15\', \'Ribeira das Tainhas\': \'09h25\', \'Vila Franca\': \'09h35\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2569, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "10h50", "end": "11h15", "stops": "{\'Ponta Gar\u00e7a\': \'10h50\', \'Caminho Novo\': \'10h55\', \'Ribeira das Tainhas\': \'11h05\', \'Vila Franca\': \'11h15\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2570, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "12h25", "end": "12h50", "stops": "{\'Ponta Gar\u00e7a\': \'12h25\', \'Caminho Novo\': \'12h30\', \'Ribeira das Tainhas\': \'12h40\', \'Vila Franca\': \'12h50\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2571, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "13h50", "end": "14h15", "stops": "{\'Ponta Gar\u00e7a\': \'13h50\', \'Caminho Novo\': \'13h55\', \'Ribeira das Tainhas\': \'14h05\', \'Vila Franca\': \'14h15\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2572, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "15h40", "end": "16h05", "stops": "{\'Ponta Gar\u00e7a\': \'15h40\', \'Caminho Novo\': \'15h45\', \'Ribeira das Tainhas\': \'15h55\', \'Vila Franca\': \'16h05\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2573, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "17h50", "end": "18h15", "stops": "{\'Ponta Gar\u00e7a\': \'17h50\', \'Caminho Novo\': \'17h55\', \'Ribeira das Tainhas\': \'18h05\', \'Vila Franca\': \'18h15\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2574, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "19h20", "end": "19h45", "stops": "{\'Ponta Gar\u00e7a\': \'19h20\', \'Caminho Novo\': \'19h25\', \'Ribeira das Tainhas\': \'19h35\', \'Vila Franca\': \'19h45\'}", "type_of_day": "WEEKDAY", "information": "None"}]',
    'Ponta Garça:Vila Franca:SATURDAY': '[{"id": 2581, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "06h40", "end": "07h05", "stops": "{\'Ponta Gar\u00e7a\': \'06h40\', \'Caminho Novo\': \'06h45\', \'Ribeira das Tainhas\': \'06h55\', \'Vila Franca\': \'07h05\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2582, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "07h40", "end": "08h05", "stops": "{\'Ponta Gar\u00e7a\': \'07h40\', \'Caminho Novo\': \'07h45\', \'Ribeira das Tainhas\': \'07h55\', \'Vila Franca\': \'08h05\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2583, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "09h30", "end": "09h55", "stops": "{\'Ponta Gar\u00e7a\': \'09h30\', \'Caminho Novo\': \'09h35\', \'Ribeira das Tainhas\': \'09h45\', \'Vila Franca\': \'09h55\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2585, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "14h30", "end": "14h55", "stops": "{\'Ponta Gar\u00e7a\': \'14h30\', \'Caminho Novo\': \'14h35\', \'Ribeira das Tainhas\': \'14h45\', \'Vila Franca\': \'14h55\'}", "type_of_day": "SATURDAY", "information": "None"}]',
    'Ponta Garça:Vila Franca:SUNDAY': '[{"id": 2592, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "07h40", "end": "08h05", "stops": "{\'Ponta Gar\u00e7a\': \'07h40\', \'Caminho Novo\': \'07h45\', \'Ribeira das Tainhas\': \'07h55\', \'Vila Franca\': \'08h05\'}", "type_of_day": "SUNDAY", "information": "None"}, {"id": 2594, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "14h30", "end": "14h55", "stops": "{\'Ponta Gar\u00e7a\': \'14h30\', \'Caminho Novo\': \'14h35\', \'Ribeira das Tainhas\': \'14h45\', \'Vila Franca\': \'14h55\'}", "type_of_day": "SUNDAY", "information": "None"}, {"id": 2595, "route": "316", "origin": "Ponta Gar\u00e7a", "destination": "Vila Franca", "start": "16h00", "end": "16h25", "stops": "{\'Ponta Gar\u00e7a\': \'16h00\', \'Caminho Novo\': \'16h05\', \'Ribeira das Tainhas\': \'16h15\', \'Vila Franca\': \'16h25\'}", "type_of_day": "SUNDAY", "information": "None"}]',

    'Vila Franca:Ponta Garça:WEEKDAY': '[{"id": 2558, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "08h30", "end": "08h55", "stops": "{\'Vila Franca\': \'08h30\', \'Ribeira das Tainhas\': \'08h40\', \'Caminho Novo\': \'08h50\', \'Ponta Gar\u00e7a\': \'08h55\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2559, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "10h10", "end": "10h35", "stops": "{\'Vila Franca\': \'10h10\', \'Ribeira das Tainhas\': \'10h20\', \'Caminho Novo\': \'10h30\', \'Ponta Gar\u00e7a\': \'10h35\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2560, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "11h30", "end": "11h55", "stops": "{\'Vila Franca\': \'11h30\', \'Ribeira das Tainhas\': \'11h40\', \'Caminho Novo\': \'11h50\', \'Ponta Gar\u00e7a\': \'11h55\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2561, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "13h00", "end": "13h25", "stops": "{\'Vila Franca\': \'13h00\', \'Ribeira das Tainhas\': \'13h10\', \'Caminho Novo\': \'13h20\', \'Ponta Gar\u00e7a\': \'13h25\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2562, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "15h00", "end": "15h25", "stops": "{\'Vila Franca\': \'15h00\', \'Ribeira das Tainhas\': \'15h10\', \'Caminho Novo\': \'15h20\', \'Ponta Gar\u00e7a\': \'15h25\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2563, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "17h10", "end": "17h35", "stops": "{\'Vila Franca\': \'17h10\', \'Ribeira das Tainhas\': \'17h20\', \'Caminho Novo\': \'17h30\', \'Ponta Gar\u00e7a\': \'17h35\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2564, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "18h40", "end": "19h05", "stops": "{\'Vila Franca\': \'18h40\', \'Ribeira das Tainhas\': \'18h50\', \'Caminho Novo\': \'19h00\', \'Ponta Gar\u00e7a\': \'19h05\'}", "type_of_day": "WEEKDAY", "information": "None"}, {"id": 2565, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "20h00", "end": "20h25", "stops": "{\'Vila Franca\': \'20h00\', \'Ribeira das Tainhas\': \'20h10\', \'Caminho Novo\': \'20h20\', \'Ponta Gar\u00e7a\': \'20h25\'}", "type_of_day": "WEEKDAY", "information": "None"}]',
    'Vila Franca:Ponta Garça:SATURDAY': '[{"id": 2575, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "08h50", "end": "09h15", "stops": "{\'Vila Franca\': \'08h50\', \'Ribeira das Tainhas\': \'09h00\', \'Caminho Novo\': \'09h10\', \'Ponta Gar\u00e7a\': \'09h15\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2577, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "11h50", "end": "12h15", "stops": "{\'Vila Franca\': \'11h50\', \'Ribeira das Tainhas\': \'12h00\', \'Caminho Novo\': \'12h10\', \'Ponta Gar\u00e7a\': \'12h15\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2578, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "13h40", "end": "14h05", "stops": "{\'Vila Franca\': \'13h40\', \'Ribeira das Tainhas\': \'13h50\', \'Caminho Novo\': \'14h00\', \'Ponta Gar\u00e7a\': \'14h05\'}", "type_of_day": "SATURDAY", "information": "None"}, {"id": 2580, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "18h20", "end": "18h45", "stops": "{\'Vila Franca\': \'18h20\', \'Ribeira das Tainhas\': \'18h30\', \'Caminho Novo\': \'18h40\', \'Ponta Gar\u00e7a\': \'18h45\'}", "type_of_day": "SATURDAY", "information": "None"}]',
    'Vila Franca:Ponta Garça:SUNDAY': '[{"id": 2588, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "10h50", "end": "11h15", "stops": "{\'Vila Franca\': \'10h50\', \'Ribeira das Tainhas\': \'11h00\', \'Caminho Novo\': \'11h10\', \'Ponta Gar\u00e7a\': \'11h15\'}", "type_of_day": "SUNDAY", "information": "None"}, {"id": 2589, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "13h20", "end": "13h50", "stops": "{\'Vila Franca\': \'13h20\', \'Ribeira das Tainhas\': \'13h30\', \'Caminho Novo\': \'13h40\', \'Ponta Gar\u00e7a\': \'13h50\'}", "type_of_day": "SUNDAY", "information": "None"}, {"id": 2591, "route": "316", "origin": "Vila Franca", "destination": "Ponta Gar\u00e7a", "start": "18h20", "end": "18h45", "stops": "{\'Vila Franca\': \'18h20\', \'Ribeira das Tainhas\': \'18h30\', \'Caminho Novo\': \'18h40\', \'Ponta Gar\u00e7a\': \'18h45\'}", "type_of_day": "SUNDAY", "information": "None"}]',

    'Lomba do Loução:Povoação:WEEKDAY': '[{"id": 2637, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "07h40", "end": "07h55", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'07h40\', \'Povoa\u00e7\u00e3o\': \'07h55\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2638, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "09h00", "end": "09h15", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'09h00\', \'Povoa\u00e7\u00e3o\': \'09h15\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2639, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "13h00", "end": "13h15", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'13h00\', \'Povoa\u00e7\u00e3o\': \'13h15\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2640, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "14h00", "end": "14h15", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'14h00\', \'Povoa\u00e7\u00e3o\': \'14h15\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2641, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "16h45", "end": "17h00", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'16h45\', \'Povoa\u00e7\u00e3o\': \'17h00\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2642, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "18h25", "end": "18h40", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'18h25\', \'Povoa\u00e7\u00e3o\': \'18h40\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2643, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "07h40", "end": "07h55", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'07h40\', \'Povoa\u00e7\u00e3o\': \'07h55\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2644, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "09h30", "end": "09h45", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'09h30\', \'Povoa\u00e7\u00e3o\': \'09h45\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2645, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "13h30", "end": "13h45", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'13h30\', \'Povoa\u00e7\u00e3o\': \'13h45\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2646, "route": "322", "origin": "Lomba do Lou\u00e7\u00e3o", "destination": "Povoa\u00e7\u00e3o", "start": "16h20", "end": "16h35", "stops": "{\'Lomba do Lou\u00e7\u00e3o\': \'16h20\', \'Povoa\u00e7\u00e3o\': \'16h35\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}]',
    'Povoação:Lomba do Loução:WEEKDAY': '[{"id": 2627, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "08h45", "end": "09h00", "stops": "{\'Povoa\u00e7\u00e3o\': \'08h45\', \'Lomba do Lou\u00e7\u00e3o\': \'09h00\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2628, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "12h30", "end": "12h45", "stops": "{\'Povoa\u00e7\u00e3o\': \'12h30\', \'Lomba do Alcaide\': \'12h40\', \'Lomba do Lou\u00e7\u00e3o\': \'12h45\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2629, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "13h45", "end": "14h00", "stops": "{\'Povoa\u00e7\u00e3o\': \'13h45\', \'Lomba do Alcaide\': \'13h55\', \'Lomba do Lou\u00e7\u00e3o\': \'14h00\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2630, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "16h10", "end": "16h25", "stops": "{\'Povoa\u00e7\u00e3o\': \'16h10\', \'Lomba do Alcaide\': \'16h20\', \'Lomba do Lou\u00e7\u00e3o\': \'16h25\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2631, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "18h10", "end": "18h15", "stops": "{\'Povoa\u00e7\u00e3o\': \'18h10\', \'Lomba do Lou\u00e7\u00e3o\': \'18h15\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Escolar\', \'en\': \'School Period\', \'es\': \'Periodo Escolar\', \'fr\': \'P\u00e9riode Scolaire\', \'de\': \'Schulzeit\'}"}, {"id": 2633, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "09h10", "end": "09h25", "stops": "{\'Povoa\u00e7\u00e3o\': \'09h10\', \'Lomba do Lou\u00e7\u00e3o\': \'09h25\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2634, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "12h30", "end": "12h45", "stops": "{\'Povoa\u00e7\u00e3o\': \'12h30\', \'Lomba do Lou\u00e7\u00e3o\': \'12h45\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2635, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "16h00", "end": "16h15", "stops": "{\'Povoa\u00e7\u00e3o\': \'16h00\', \'Lomba do Alcaide\': \'16h10\', \'Lomba do Lou\u00e7\u00e3o\': \'16h15\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}, {"id": 2636, "route": "322", "origin": "Povoa\u00e7\u00e3o", "destination": "Lomba do Lou\u00e7\u00e3o", "start": "18h35", "end": "18h50", "stops": "{\'Povoa\u00e7\u00e3o\': \'18h35\', \'Lomba do Lou\u00e7\u00e3o\': \'18h50\'}", "type_of_day": "WEEKDAY", "information": "{\'pt\': \'Per\u00edodo Normal\', \'en\': \'Normal Period\', \'es\': \'Periodo normal\', \'fr\': \'P\u00e9riode normale\', \'de\': \'Normale Periode\'}"}]',
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
        url_origin = origin
        url_destination = destination
        if origin in ['Povoação', 'Lomba do Loução', 'Ponta Garça']:
            if origin == 'Povoação':
                url_origin = 'Povoacão'
            elif origin == 'Lomba do Loução':
                url_origin = 'Lomba do Loucão'
            elif origin == 'Ponta Garça':
                url_origin = 'Ponta Garca'
        if destination in ['Povoação', 'Lomba do Loução', 'Ponta Garça']:
            if destination == 'Povoação':
                url_destination = 'Povoacão'
            elif destination == 'Lomba do Loução':
                url_destination = 'Lomba do Loucão'
            elif destination == 'Ponta Garça':
                url_destination = 'Ponta Garca'
        URL = 'https://saomiguelbus-api.herokuapp.com/api/v1/route?origin=' + url_origin + '&destination=' + url_destination + '&day=' + DAYS[day] + '&start=' + time
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
        json_response = json.loads(response.text)
        if (origin in ['Lomba do Loução', 'Ponta Garça'] or destination in ['Lomba do Loução', 'Ponta Garça']):
            print("Retrieving data from local database...")
            key = f"{origin}:{destination}:{DAYS[day]}"
            if key in LOCAL_DB:
                response_text = LOCAL_DB[key]
                print(response_text)
                return json.loads(response_text)
        elif (origin == 'Povoação' or destination == 'Povoação'):
            print("Retrieving data from all routes...")
            povoacao_routes = []
            try:
                response = requests.get("https://saomiguelbus-api.herokuapp.com/api/v1/routes")
            except Exception as e:
                print(e)
                return []
            for route in json.loads(response.text):
                route['origin'] = origin
                route['destination'] = destination
                route['start'] = "00h00"
                route['end'] = "00h00"
                if route["type_of_day"] != DAYS[day] or route["disabled"] == True:
                    continue
                route_stops = route['stops']
                if origin in route_stops and destination in route_stops:
                    print(route_stops)
                    if origin == "Povoação":
                        if route_stops.index(origin) < route_stops.index(destination):
                            povoacao_routes.append(route)
                    elif destination == "Povoação":
                        if route_stops.index(origin) > route_stops.index(destination):
                            povoacao_routes.append(route)
            return povoacao_routes
        return json_response if response.status_code == 200 else []



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
