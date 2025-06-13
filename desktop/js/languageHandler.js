document.addEventListener("DOMContentLoaded", function() {
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
    const languageSelect = document.getElementById('language');

    if (languageSelect) {
        languageSelect.value = LANG;
    }

    const langTexts = LANGS[language];
    // Populate HTML elements with values from langTexts...
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

    let searchWarningElement = document.getElementById('searchWarning');
    if (searchWarningElement) {
        searchWarningElement.textContent = langTexts.warning;
    } else {
        console.warn('Element with id "searchWarning" not found');
    }
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
    document.getElementById('patreonSubtitle').textContent = langTexts.patreon_subtitle
    document.getElementById('websiteInfo').textContent = langTexts.info_warning
    document.getElementById('chamadasLabel').textContent = langTexts.chamadas_label

    let anchorTag = document.querySelector('.badge-image.grey-out').parentNode;

    if (language === 'pt') {
        anchorTag.href = '/newsletter/';
    } else {
        anchorTag.href = '/newsletter-eng/';
    }

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
        'Transfer': 'transfer',
        'Transfers': 'transfers',
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
        'chamadas_label': "(We don't answer calls)",
        'patreon_subtitle': "Follow me on Patreon and be the first to know about new updates, releases, and much more!",
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
        'Transfer': 'paragem',
        'Transfers': 'paragens',
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
        'chamadas_label': "(Não atendemos chamadas)",
        'patreon_subtitle': "Segue-me no Patreon e sê o primeiro a saber sobre novas atualizações, lançamentos e muito mais!",
        'route_warning': 'Informação retirada de fontes públicas disponibilizadas pelas empresas de autocarros',
        "info_warning": "Este site não é afiliado a nenhuma empresa ou organização. O horário usado foi retirado de documentos públicos disponibilizados pelas empresas de autocarros. Alguns horários podem estar desatualizados!"
    },
    'it': {
        'website_title': 'São Miguel Bus',
        'title': 'Cerca un Autobus',
        'subtitle': 'Trova il percorso migliore per te.',
        'From': 'Da',
        'To': 'A',
        'From_placeholder': 'Inserisci la tua origine...',
        'To_placeholder': 'Inserisci la tua destinazione...',
        'Day': 'Giorno della Settimana',
        'Weekday': 'Giorno feriale',
        'Saturday': 'Sabato',
        'Sunday': 'Domenica/Festivo',
        'Time': 'A che ora?',
        'Optional': 'Opzionale',
        'Search': 'Cerca un Autobus',
        'Transfer': 'trasferimento',
        'Transfers': 'trasferimenti',
        'warning': 'Vengono mostrati solo i percorsi diretti',
        'No_routes1': 'Nessuna rotta trovata da',
        "No_routes2": "a",
        'No_routes_subtitle': 'Controlla l\'ortografia. Scegli una fermata dalle opzioni visualizzate.',
        'Search_menu': 'Cerca',
        'Contact': 'Contatta',
        'card_title': 'Mettiti in Contatto',
        'contact_title': 'Hai trovato qualcosa di sbagliato?',
        'contact_subtitle': 'Siamo aperti per qualsiasi suggerimento o solo per fare una chiacchierata',
        'contact_name': 'Nome',
        'contact_email': 'Email',
        'contact_subject': 'Oggetto',
        'contact_message': 'Messaggio',
        'contact_button': 'Invia Messaggio Ora',
        'chamadas_label': "(Non rispondiamo alle chiamate)",
        'patreon_subtitle': "Seguimi su Patreon e sii il primo a sapere sui nuovi aggiornamenti, rilasci e molto altro!",
        'route_warning': 'Informazioni prese da fonti pubbliche fornite dalle compagnie di autobus',
        'info_warning': "Questo sito web non è affiliato con nessuna azienda o organizzazione. L'orario presente è stato preso da documenti pubblici resi disponibili dalle compagnie di autobus. Alcuni percorsi/orari potrebbero essere obsoleti!",
    },
    'uk': {
        'website_title': 'São Miguel Bus',
        'title': 'Знайти Автобус',
        'subtitle': 'Знайдіть найкращий маршрут для вас.',
        'From': 'Звідки',
        'To': 'Куди',
        'From_placeholder': 'Введіть вашу відправну точку...',
        'To_placeholder': 'Введіть ваш пункт призначення...',
        'Day': 'День Тижня',
        'Weekday': 'Будній день',
        'Saturday': 'Субота',
        'Sunday': 'Неділя/Свято',
        'Time': 'О котрій годині?',
        'Optional': 'Необов\'язково',
        'Search': 'Шукати Автобус',
        'Transfer': 'пересадка',
        'Transfers': 'пересадки',
        'warning': 'Показуються лише прямі маршрути',
        'No_routes1': 'Не знайдено маршрутів з',
        "No_routes2": "до",
        'No_routes_subtitle': 'Перевірте правопис. Виберіть зупинку з показаних варіантів.',
        'Search_menu': 'Пошук',
        'Contact': 'Контакт',
        'card_title': 'Зв\'язатися',
        'contact_title': 'Знайшли щось неправильне?',
        'contact_subtitle': 'Ми відкриті для будь-яких пропозицій або просто для розмови',
        'contact_name': 'Ім\'я',
        'contact_email': 'Електронна пошта',
        'contact_subject': 'Тема',
        'contact_message': 'Повідомлення',
        'contact_button': 'Надіслати Повідомлення Зараз',
        'chamadas_label': "(Ми не відповідаємо на дзвінки)",
        'patreon_subtitle': "Підписуйтеся на мене в Patreon і будьте першими, хто дізнається про нові оновлення, релізи та багато іншого!",
        'route_warning': 'Інформація взята з публічних джерел, наданих автобусними компаніями',
        'info_warning': "Цей веб-сайт не пов'язаний з жодною компанією чи організацією. Поточний розклад був взятий з публічних документів, наданих автобусними компаніями. Деякі маршрути/години можуть бути застарілими!",
    },
    'zh': {
        'website_title': '圣米格尔巴士',
        'title': '搜索巴士',
        'subtitle': '找到最适合您的路线。',
        'From': '出发地',
        'To': '目的地',
        'From_placeholder': '输入您的出发点...',
        'To_placeholder': '输入您的目的地...',
        'Day': '星期几',
        'Weekday': '工作日',
        'Saturday': '星期六',
        'Sunday': '星期日/假日',
        'Time': '什么时间？',
        'Optional': '可选',
        'Search': '搜索巴士',
        'Transfer': '换乘',
        'Transfers': '换乘',
        'warning': '仅显示直达路线',
        'No_routes1': '未找到从',
        "No_routes2": "到",
        'No_routes_subtitle': '请注意拼写。从显示的选项中选择一个站点。',
        'Search_menu': '搜索',
        'Contact': '联系',
        'card_title': '联系我们',
        'contact_title': '发现了什么问题吗？',
        'contact_subtitle': '我们欢迎任何建议或只是聊天',
        'contact_name': '姓名',
        'contact_email': '电子邮件',
        'contact_subject': '主题',
        'contact_message': '消息',
        'contact_button': '立即发送消息',
        'chamadas_label': "(我们不接听电话)",
        'patreon_subtitle': "在Patreon上关注我，第一时间了解新的更新、发布和更多内容！",
        'route_warning': '信息取自巴士公司提供的公共来源',
        'info_warning': "本网站不隶属于任何公司或组织。当前时刻表取自巴士公司提供的公共文件。某些路线/时间可能已过时！",
    }
};

let LANG = 'pt';