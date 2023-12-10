document.addEventListener("DOMContentLoaded", function() {
    console.log('Applying text to page elements...')
    // Function to get the 'lang' query parameter value
    function getLanguageFromQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        LANG = urlParams.get('lang') || LANG; // TODO: Default to Portuguese if no parameter is found
        return LANG
    }

    // Set the language based on the query parameter
    setTextBasedOnLanguage(getLanguageFromQuery());
});

// Function to set text based on selected language
function setTextBasedOnLanguage(language) {
    console.log('Switching language to ' + language)
    const langTexts = LANGS[language];
    // Populate HTML elements with values from langTexts...
    // ...
    document.title = langTexts.website_title;
    document.getElementById('navBarSearchLabel').textContent = langTexts.Search_menu
    document.getElementById('navBarContactLabel').textContent = langTexts.Contact
    document.getElementById('bannerTitle').textContent = langTexts.title
    document.getElementById('bannerSubtitle').textContent = langTexts.subtitle
    document.getElementById('originLabel').textContent = langTexts.From
    document.getElementById('origin').placeholder = langTexts.From_placeholder
    document.getElementById('destinationLabel').textContent = langTexts.To
    document.getElementById('destination').placeholder = langTexts.To_placeholder
    document.getElementById('dayLabel').textContent = langTexts.Day
    document.getElementById('weekday').textContent = langTexts.Weekday
    document.getElementById('saturday').textContent = langTexts.Saturday
    document.getElementById('sunday').textContent = langTexts.Sunday
    document.getElementById('timeLabel').textContent = langTexts.Time
    document.getElementById('timeLabelSubtitle').textContent = langTexts.Optional
    document.getElementById('searchButton').textContent = langTexts.Search
    document.getElementById('searchWarning').textContent = langTexts.warning

    document.getElementById('formTitle').textContent = langTexts.contact_title
    document.getElementById('formSubtitle').textContent = langTexts.contact_subtitle
    document.getElementById('nameLabel').textContent = langTexts.contact_name
    document.getElementById('name').placeholder = langTexts.contact_name
    document.getElementById('subjectLabel').textContent = langTexts.contact_subject
    document.getElementById('subject').placeholder = langTexts.contact_subject
    document.getElementById('messageLabel').textContent = langTexts.contact_message
    document.getElementById('message').placeholder = langTexts.contact_message
    document.getElementById('submitForm').value = langTexts.contact_button
    document.getElementById('contactCardTitle').textContent = langTexts.card_title
    document.getElementById('support').textContent = langTexts.support
    document.getElementById('supportBold').textContent = langTexts.support_bold
    document.getElementById('websiteInfo').textContent = langTexts.info_warning

}

// LANGS object with all your language-specific text
const LANGS = {
    'en': {
        'website_title': 'São Miguel Bus',
        'title': 'Search a Bus',
        'subtitle': 'Find the best bus for you.',
        'From': 'From',
        'To': 'To',
        'From_placeholder': 'Type your origin...',
        'To_placeholder': 'Type your destination...',
        'Day': 'Day of the Week',
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
};

LANG = 'en';