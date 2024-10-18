// Inicializar armazenamento de respostas
let userResponses = {
    language: currentLanguage,
    firstTime: null,
    residenceStatus: null,
    guidePreference: null,
    paymentWillingness: null
};

// Definir as perguntas e suas opções
const questions = [
    {
        id: 1,
        text: t("question1"),
        options: [
            { label: t("optionYes"), value: "sim" },
            { label: t("optionNo"), value: "nao" }
        ],
    },
    {
        id: 2,
        text: t("question2"),
        options: [
            { label: t("optionResident"), value: "residente" },
            { label: t("optionTourist"), value: "turista" }
        ],
        conditional: true
    },
    {
        id: 3,
        text: t("question3"),
        options: [
            { label: t("optionYes"), value: "sim" },
            { label: t("optionNo"), value: "nao" }
        ],
        condition: (responses) => responses.residenceStatus === "residente"
    },
    {
        id: 4,
        text: t("question4"),
        options: [
            { label: t("optionYes"), value: "sim" },
            { label: t("optionNo"), value: "nao" }
        ],
        condition: (responses) => responses.residenceStatus === "turista"
    },
    {
        id: 5,
        text: t("question5"),
        options: [
            { label: t("optionYes"), value: "sim" },
            { label: t("optionNo"), value: "nao" }
        ],
    }
];

let currentQuestionIndex = 0;

// Função para exibir a próxima pergunta aplicável
function showNextQuestion() {
    if (userResponses.paymentWillingness !== null) {
        displayThankYou();
        return;
    }
    // Limpar botões anteriores
    const answerButtonsDiv = document.getElementById('answerButtonsContainer');
    answerButtonsDiv.innerHTML = '';

    // Se o usuário respondeu "não" na primeira pergunta, mostrar mensagem e encerrar
    if (currentQuestionIndex === 1 && userResponses.firstTime === "nao") {
        displayNoMoreQuestions();
        return;
    } else if ((currentQuestionIndex === 3 && userResponses.guidePreference === "nao") || (currentQuestionIndex === 4 && userResponses.guidePreference === "nao")) {
        displayThankYou();
        return;
    }

    // Determinar a próxima pergunta com base nas condições
    while (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        if (question.condition) {
            if (!question.condition(userResponses)) {
                currentQuestionIndex++;
                continue;
            }
        }
        displayQuestion(question);
        break;
    }

    // Se não houver mais perguntas, agradecer ao usuário
    if (currentQuestionIndex >= questions.length + 1) {
        displayThankYou();
    }
}

// Função para exibir uma pergunta e seus botões de resposta
function displayQuestion(question) {
    const chatContent = document.getElementById('chatContent');
    const answerButtonsDiv = document.getElementById('answerButtonsContainer');

    // Exibir a pergunta
    const questionElement = document.createElement('p');
    questionElement.classList.add('text-left', 'text-gray-700', 'mt-2');
    questionElement.setAttribute('data-i18n', question.dataI18n);
    questionElement.textContent = t(question.text); // ou use t(question.text) se aplicar tradução
    chatContent.appendChild(questionElement);

    // Criar botões para as opções
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add(
            'bg-green-500',
            'text-white',
            'py-2',
            'px-4',
            'rounded-full',
            'hover:bg-green-600',
            'transition',
            'duration-300',
            'ease-in-out'
        );
        button.setAttribute('data-i18n', option.label);
        button.setAttribute('data-umami-event', `chat-answer-${question.id}-${option.value}`);
        button.textContent = t(option.label); // ou use t(option.label) se aplicar tradução
        button.addEventListener('click', () => handleAnswer(question.id, option.value));
        answerButtonsDiv.appendChild(button);
    });

    currentQuestionIndex++;

    // Scroll down to the bottom of the chat
    chatContent.scrollTop = chatContent.scrollHeight;
}

// Função para lidar com a resposta do usuário
function handleAnswer(questionId, answerValue) {
    switch(questionId) {
        case 1:
            userResponses.firstTime = answerValue;
            break;
        case 2:
            userResponses.residenceStatus = answerValue;
            break;
        case 3:
            userResponses.guidePreference = answerValue;
            break;
        case 4:
            userResponses.guidePreference = answerValue;
            break;
        case 5:
            userResponses.paymentWillingness = answerValue;
            break;
        default:
            displayThankYou();
            break;
    }

    // Exibir a resposta do usuário no chat
    const chatContent = document.getElementById('chatContent');
    const userResponse = document.createElement('p');
    userResponse.classList.add('text-right', 'text-blue-500', 'mt-2');
    if (answerValue === 'sim' || answerValue === 'nao') {
        userResponse.textContent = answerValue === 'sim' ? t("optionYes") : t("optionNo");
    } else if (answerValue === 'residente' || answerValue === 'turista') {
        userResponse.textContent = answerValue === 'residente' ? t("optionResident") : t("optionTourist");
    }
    chatContent.appendChild(userResponse);

    // Mostrar a próxima pergunta
    showNextQuestion();
}

// Função para exibir a mensagem de agradecimento e salvar as respostas
function displayThankYou() {
    console.log("Todas as perguntas respondidas. Exibindo agradecimento.");
    const chatContent = document.getElementById('chatContent');
    const answerButtonsDiv = document.getElementById('answerButtonsContainer');

    // Exibir a mensagem de agradecimento
    const thankYouMsg = document.createElement('p');
    thankYouMsg.classList.add('text-left', 'text-gray-700', 'mt-2');
    thankYouMsg.setAttribute('data-i18n', 'thankYouMessage');
    thankYouMsg.textContent = t("question6");
    chatContent.appendChild(thankYouMsg);

    // Ocultar os botões de resposta
    answerButtonsDiv.innerHTML = '';
    chatContent.scrollTop = chatContent.scrollHeight;

    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Enviar as respostas para o backend via fetch (opcional)
        fetch('http://127.0.0.1:8000/ai/api/v1/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userResponses)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Feedback salvo com sucesso:', data);
        })
        .catch((error) => {
            console.error('Erro ao salvar feedback:', error);
        });
    }
}

// Função para exibir mensagem quando não há mais perguntas
function displayNoMoreQuestions() {
    console.log("Usuário respondeu 'não' na primeira pergunta. Exibindo mensagem final.");
    const chatContent = document.getElementById('chatContent');
    const answerButtonsDiv = document.getElementById('answerButtonsContainer');

    // Exibir a mensagem final
    const finalMsg = document.createElement('p');
    finalMsg.classList.add('text-left', 'text-gray-700', 'mt-2');
    finalMsg.textContent = t("noMoreQuestions");
    chatContent.appendChild(finalMsg);

    // Ocultar os botões de resposta
    answerButtonsDiv.innerHTML = '';
    chatContent.scrollTop = chatContent.scrollHeight;

}

// Função para limpar o chat
function clearChat() {
    const chatContent = document.getElementById('chatContent');
    const answerButtonsDiv = document.getElementById('answerButtonsContainer');

    chatContent.innerHTML = '';
    answerButtonsDiv.innerHTML = '';
    currentQuestionIndex = 0;
    userResponses = {
        firstTime: null,
        residenceStatus: null,
        guidePreference: null,
        paymentWillingness: null
    };
}

// Função para descartar o botão do robô
function dismissRobotButton() {
    const feedbackRobotButton = document.getElementById('feedbackRobotButton');
    feedbackRobotButton.style.display = 'none';
}

// Função para exibir a próxima pergunta quando o chat for aberto
function openChat() {
    document.getElementById('chatWindow').classList.remove('hidden');
    document.getElementById('feedbackRobotButton').classList.add('hidden');

    showNextQuestion();
}

// Event Listeners
document.getElementById('openChatBtn').addEventListener('click', openChat);
document.getElementById('closeChatBtn').addEventListener('click', function() {
    document.getElementById('chatWindow').classList.add('hidden');
    clearChat();
    document.getElementById('closeRobotBtn').classList.remove('hidden');
    document.getElementById('feedbackRobotButton').classList.remove('hidden');
});

// Mostrar botão de descartar ao passar o mouse
document.getElementById('feedbackRobotButton').addEventListener('mouseenter', function() {
    document.getElementById('closeRobotBtn').classList.remove('hidden');
});

document.getElementById('feedbackRobotButton').addEventListener('mouseleave', function() {
    document.getElementById('closeRobotBtn').classList.add('hidden');
});