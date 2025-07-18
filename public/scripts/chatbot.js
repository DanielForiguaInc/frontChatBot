document.addEventListener('DOMContentLoaded', function() {
  // Configuración de logs
  const DEBUG_LOG = false;
  const DEBUG_ERROR = true;
  const DEBUG_WARN = false;

  function log(...args) { if (DEBUG_LOG) console.log(...args); }
  function logError(...args) { if (DEBUG_ERROR) console.error(...args); }
  function logWarn(...args) { if (DEBUG_WARN) console.warn(...args); }

  log('chatbot.js cargado correctamente');

  // Áreas válidas y keywords basadas en el JSON del backend
  const validAreas = ['talanquera', 'cajero', 'datafono', 'mantenimiento'];
  const commonKeywords = [
    'no funciona', 'fallo', 'entrada', 'ticket', 'bloqueada', 'batería', 'hoja',
    'sensores', 'limpieza', 'lector', 'no enciende', 'táctil', 'flojo', 'peligro', 'moovi', 'control'
  ];

  // Estado del bot
  let isBotTyping = false;
  let selectedArea = null;
  let userRole = null;
  localStorage.removeItem('userRole');
  localStorage.removeItem('selectedArea');
  let currentLanguage = 'es';
  let conversationHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  let isChatInitialized = false; // Reiniciar a false al cargar

  // Inicializar estado desde localStorage
  userRole = localStorage.getItem('userRole') || null;
  selectedArea = localStorage.getItem('selectedArea') || null;
  
  // Traducciones
  const translations = {
    es: {
      welcome: '¡Hola! Soy tu asistente técnico de INCOMELEC S.A.S. Selecciona tu rol para comenzar.',
      rolePrompt: 'Por favor, selecciona tu rol: técnico o ingeniero.',
      areaPrompt: 'Por favor, selecciona un área del problema.',
      describeMore: 'Por favor, describe el problema con más detalles',
      problemNotRecognized: 'No reconozco ese problema. Intenta con otras palabras, como "fallo en la entrada".',
      emptyMessage: 'Por favor, escribe un mensaje válido.',
      messageTooLong: 'Tu mensaje es demasiado largo. Usa menos de 500 caracteres.',
      voiceError: 'Error en reconocimiento de voz. Usa texto, por favor.',
      voiceNotAvailable: 'El reconocimiento de voz no está disponible en este navegador.',
      noHistory: 'No hay interacciones previas en esta sesión.',
      noHistoryToDownload: 'No hay historial para descargar.',
      messageSent: 'Mensaje enviado',
      connectionLost: 'Conexión perdida',
      connectionRestored: 'Conexión restablecida',
      technician: 'Técnico',
      engineer: 'Ingeniero',
      yes: 'Sí',
      no: 'No',
      pleasureToHelp: 'Fue un placer ayudarte.'
    },
    en: {
      welcome: 'Hello! I am your technical assistant from INCOMELEC S.A.S. Select your role to start.',
      rolePrompt: 'Please select your role: technician or engineer.',
      areaPrompt: 'Please select the area of the issue.',
      describeMore: 'Please describe the issue in more detail',
      problemNotRecognized: 'I don’t recognize that issue. Try different words, like "screen won’t turn on."',
      emptyMessage: 'Please enter a valid message.',
      messageTooLong: 'Your message is too long. Use less than 500 characters.',
      voiceError: 'Error in voice recognition. Please use text instead.',
      voiceNotAvailable: 'Voice recognition is not available in this browser.',
      noHistory: 'There are no previous interactions in this session.',
      noHistoryToDownload: 'There is no history to download.',
      messageSent: 'Message sent',
      connectionLost: 'Connection lost',
      connectionRestored: 'Connection restored',
      technician: 'Technician',
      engineer: 'Engineer',
      yes: 'Yes',
      no: 'No',
      pleasureToHelp: 'It was a pleasure to help you.'
    }
  };

  // Elementos del DOM
  const chatBubble = document.getElementById('chatBubble');
  const chatContainer = document.getElementById('chatContainer');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const voiceButton = document.getElementById('voiceButton');
  const historyButton = document.getElementById('historyButton');
  const downloadButton = document.getElementById('downloadButton');
  const resetButton = document.getElementById('resetButton');
  const closeButton = document.getElementById('close-button');
  const themeToggle = document.getElementById('themeToggle');
  const languageButton = document.getElementById('languageButton');
  const notification = document.getElementById('notification');

  // Verificación de elementos esenciales del DOM (sin roleSelector ni areaSelector)
  if (!chatBody || !chatInput || !sendButton || !resetButton || !themeToggle || !languageButton || !notification) {
    logError('Error: No se encontraron elementos del DOM necesarios');
    return;
  }
  log('Elementos del DOM cargados correctamente');

  // Modo oscuro/claro
  let isDarkMode = false;
  themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.classList.toggle('dark-mode', isDarkMode);
  });

  // Selector de idioma
  languageButton.addEventListener('click', () => {
    log('Clic en languageButton');
    const languages = ['es', 'en'];
    const currentIndex = languages.indexOf(currentLanguage);
    currentLanguage = languages[(currentIndex + 1) % languages.length];
    log('Idioma cambiado a:', currentLanguage);
    resetConversation();
  });

  // Detección de conectividad
  window.addEventListener('offline', () => {
    log('Conexión perdida');
    showNotification(translations[currentLanguage].connectionLost, 5000);
    sendButton.disabled = true;
  });

  window.addEventListener('online', () => {
    log('Conexión restablecida');
    showNotification(translations[currentLanguage].connectionRestored);
    updateSendButtonState();
  });

  // Mostrar/Ocultar chat y mensaje de bienvenida
  chatBubble.addEventListener('click', () => {
  log('Clic en chatBubble, isChatInitialized:', isChatInitialized, 'userRole:', userRole);
  const currentDisplay = chatContainer.style.display;
  if (currentDisplay === 'none' || currentDisplay === '') {
    chatContainer.style.display = 'flex';
    if (!isChatInitialized) {
      addMessageWithButtons(translations[currentLanguage].welcome, [
        { text: translations[currentLanguage].technician, action: () => setRole('technician') },
        { text: translations[currentLanguage].engineer, action: () => setRole('engineer') }
      ]);
      isChatInitialized = true;
      localStorage.setItem('isChatInitialized', 'true'); // Guardar después de inicializar
    }
  } else {
    chatContainer.style.display = 'none';
  }
});

  closeButton.addEventListener('click', () => {
    log('Clic en closeButton');
    chatContainer.style.display = 'none';
  });

  // Ajustar altura del textarea
  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    const content = chatInput.value;
    const numberOfLines = content === '' ? 1 : content.split('\n').length;
    const minHeight = parseFloat(getComputedStyle(chatInput).minHeight);
    const maxHeight = 150;

    if (content === '') {
      chatInput.style.height = `${minHeight}px`;
      chatInput.style.overflowY = 'hidden';
    } else if (numberOfLines <= 1) {
      chatInput.style.height = `${minHeight}px`;
      chatInput.style.overflowY = 'hidden';
    } else {
      const newHeight = Math.min(chatInput.scrollHeight, maxHeight);
      chatInput.style.height = `${newHeight}px`;
      chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }

  // Actualizar estado del botón de enviar
  function updateSendButtonState() {
  const isRoleSelected = userRole !== null;
  const isAreaSelected = selectedArea !== null;
  const isMessageWritten = chatInput.value.trim() !== '';
  const isDisabled = !isRoleSelected || !isAreaSelected || !isMessageWritten;
  sendButton.disabled = isDisabled;
}

  // Función para agregar mensajes simples
  function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'bot' ? 'bot-message' : 'user-message';
    messageDiv.innerHTML = sender === 'bot' 
      ? `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${text}</span>` 
      : `<span>${text}</span>`;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    conversationHistory.push({ sender, text, timestamp: new Date().toISOString() });
    try {
      localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    } catch (error) {
      logError('Error al guardar en localStorage:', error);
    }
  }

  // Función para agregar mensajes con botones
  function addMessageWithButtons(text, options) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${text}</span>`;
    chatBody.appendChild(messageDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'chat-options';
    options.forEach(opt => {
      const button = document.createElement('button');
      button.className = 'option-button';
      button.textContent = opt.text;
      button.addEventListener('click', opt.action);
      optionsDiv.appendChild(button);
    });
    chatBody.appendChild(optionsDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Establecer rol y mostrar opciones de área
  function setRole(role) {
  userRole = role;
  localStorage.setItem('userRole', role);
  
  // Crear el contenedor del dropdown
  const messageDiv = document.createElement('div');
  messageDiv.className = 'bot-message';
  messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].areaPrompt}</span>`;
  chatBody.appendChild(messageDiv);

  // Crear el dropdown
  const selectDiv = document.createElement('div');
  selectDiv.className = 'chat-options';
  const select = document.createElement('select');
  select.className = 'area-dropdown';
  select.innerHTML = '<option value="">Selecciona un área</option>' + 
    validAreas.map(area => `<option value="${area}">${area.charAt(0).toUpperCase() + area.slice(1)}</option>`).join('');
  
  // Crear el botón de selección
  const selectButton = document.createElement('button');
  selectButton.className = 'option-button';
  selectButton.textContent = 'Seleccionar';
  selectButton.addEventListener('click', () => {
    const selectedAreaValue = select.value;
    if (selectedAreaValue) {
      setArea(selectedAreaValue);
      selectDiv.remove(); // Eliminar el dropdown después de seleccionar
    }
  });

  // Añadir dropdown y botón al chat
  selectDiv.appendChild(select);
  selectDiv.appendChild(selectButton);
  chatBody.appendChild(selectDiv);
  chatBody.scrollTop = chatBody.scrollHeight;

  updateSendButtonState();
}

  // Establecer área
  function setArea(area) {
  selectedArea = area;
  localStorage.setItem('selectedArea', area); // Guardar en localStorage
  addMessage('bot', translations[currentLanguage].describeMore);
  updateSendButtonState();
}

  // Extraer keywords del input
  function extractKeywords(input) {
    const words = input.toLowerCase().split(/\s+/);
    let keywords = [selectedArea]; // El área ya seleccionada es la primera keyword

    // Buscar keywords relevantes
    const matchedKeywords = words.filter(word => commonKeywords.includes(word));
    keywords = keywords.concat(matchedKeywords);

    // Completar con otras palabras si es necesario
    if (keywords.length < 3) {
      const remainingWords = words.filter(word => !keywords.includes(word) && word.length > 3);
      keywords = keywords.concat(remainingWords);
    }

    return keywords.slice(0, 3); // Máximo 3 keywords
  }

// Procesar input del usuario
async function processUserInput(input) {
  log('Procesando input:', input); // Mantendré logs mínimos por si necesitas depurar
  input = input.trim();
  if (!input) {
    showTypingAndRespond(translations[currentLanguage].emptyMessage);
    return;
  }
  if (input.length > 500) {
    showTypingAndRespond(translations[currentLanguage].messageTooLong);
    return;
  }
  if (!userRole) {
    showTypingAndRespond(translations[currentLanguage].rolePrompt, [
      { text: translations[currentLanguage].technician, action: () => setRole('tecnico') },
      { text: translations[currentLanguage].engineer, action: () => setRole('ingeniero') }
    ]);
    return;
  }
  if (!selectedArea) {
    showTypingAndRespond(translations[currentLanguage].areaPrompt, validAreas.map(area => ({
      text: area.charAt(0).toUpperCase() + area.slice(1),
      action: () => setArea(area)
    })));
    return;
  }

  // Añadir el mensaje al chat y limpiar el textarea inmediatamente
  addMessage('user', input);
  chatInput.value = ''; // Limpiar el textarea
  updateSendButtonState(); // Actualizar el estado del botón
  adjustTextareaHeight(); // Ajustar la altura del textarea

  // Mostrar el spinner en su propio contenedor
  const spinnerContainer = document.createElement('div');
  spinnerContainer.className = 'spinner-container'; // Contenedor específico
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.innerHTML = `<img src="./assets/Images/spinner.svg" alt="Cargando" class="spinner-img">`;
  spinnerContainer.appendChild(spinner);
  chatBody.appendChild(spinnerContainer);
  chatBody.scrollTop = chatBody.scrollHeight;

  const keywords = extractKeywords(input);
  if (keywords.length < 3 && !input.toLowerCase().match(/^(si|sí|no)$/i)) {
    spinnerContainer.remove(); // Remover el contenedor completo
    showTypingAndRespond(translations[currentLanguage].describeMore);
    return;
  }

  const query = keywords.map(encodeURIComponent).join(',');
  const adjustedRole = userRole === 'technician' ? 'tecnico' : 'ingeniero';
  const url = `https://backendchatbot-ylq2.onrender.com/api/solucion/buscar?q=${query}&rol=${encodeURIComponent(adjustedRole)}&area=${encodeURIComponent(selectedArea)}`;
  console.log('Solicitud enviada a:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del backend:', { status: response.status, message: errorText });
      throw new Error(`Error ${response.status}: ${errorText || 'Solicitud inválida'}`);
    }

    const data = await response.json();
    let message;
    if (data.soluciones && data.soluciones.length > 0) {
      const solution = data.soluciones[0];
      message = `
        <strong>Área:</strong> ${solution.area}<br>
        <strong>Prioridad:</strong> ${solution.priority}<br>
        <strong>Descripción:</strong> ${solution.description}<br>
        <strong>Solución:</strong> 
      `;
      if (solution.solucion && solution.solucion.startsWith('http')) {
        message += `<a href="${solution.solucion}" target="_blank">Descargar documento</a>`;
      } else {
        message += solution.solucion || translations[currentLanguage].problemNotRecognized;
      }
      // Mostrar la solución primero
      spinnerContainer.remove(); // Remover el contenedor completo
      showTypingAndRespond(message);

      // Mostrar la pregunta y los botones inmediatamente después
      showTypingAndRespond('¿Fue útil esta solución?', [
        { text: translations[currentLanguage].yes, action: () => handleSolutionConfirmation(true) },
        { text: translations[currentLanguage].no, action: () => handleSolutionConfirmation(false) }
      ]);
    } else {
      message = translations[currentLanguage].problemNotRecognized;
      spinnerContainer.remove(); // Remover el contenedor completo
      showTypingAndRespond(message);
    }
  } catch (error) {
    console.error('Error al conectar con el backend', error.message);
    spinnerContainer.remove(); // Remover el contenedor completo
    showTypingAndRespond('Error al conectar con el servidor interno. Intenta de nuevo.');
  }
  // El textarea ya está limpio, no necesitamos repetirlo aquí
updateSendButtonState(); // Deshabilitar el botón tras enviar
}

  // Mostrar indicador de escribiendo y responder
function showTypingAndRespond(message, options = [], delay = 2000, callback = () => {}) {
  log('Mostrando indicador de escribiendo');
  isBotTyping = true;
  updateSendButtonState();

  const existingIndicator = chatBody.querySelector('.typing-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const typingIndicator = document.createElement('div');
  typingIndicator.classList.add('typing-indicator');
  typingIndicator.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
  chatBody.appendChild(typingIndicator);
  chatBody.scrollTop = chatBody.scrollHeight;

  setTimeout(() => {
    typingIndicator.remove();
    isBotTyping = false;
    updateSendButtonState();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${message}</span>`;
    chatBody.appendChild(messageDiv);

    if (options.length > 0) {
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'chat-options';
      options.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = opt.text;
        button.addEventListener('click', opt.action);
        optionsDiv.appendChild(button);
      });
      chatBody.appendChild(optionsDiv);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
    // Ejecutar callback después de mostrar el mensaje
    setTimeout(callback, delay); // Retraso adicional para el callback
  }, 1500); // Retraso original del indicador
}

function handleSolutionConfirmation(isSolved) {
  if (isSolved) {
    // Mostrar el mensaje de despedida primero
    showTypingAndRespond(translations[currentLanguage].pleasureToHelp, [], 1000, () => {
      // Reiniciar estado después del mensaje
      selectedArea = null;
      chatInput.value = '';
      updateSendButtonState();

      // Crear el contenedor del dropdown
      const messageDiv = document.createElement('div');
      messageDiv.className = 'bot-message';
      messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].areaPrompt}</span>`;
      chatBody.appendChild(messageDiv);

      // Crear el dropdown
      const selectDiv = document.createElement('div');
      selectDiv.className = 'chat-options';
      const select = document.createElement('select');
      select.className = 'area-dropdown';
      select.innerHTML = '<option value="">Selecciona un área</option>' + 
        validAreas.map(area => `<option value="${area}">${area.charAt(0).toUpperCase() + area.slice(1)}</option>`).join('');
      
      // Crear el botón de selección
      const selectButton = document.createElement('button');
      selectButton.className = 'option-button';
      selectButton.textContent = 'Seleccionar';
      selectButton.addEventListener('click', () => {
        const selectedAreaValue = select.value;
        if (selectedAreaValue) {
          setArea(selectedAreaValue);
          selectDiv.remove();
        }
      });

      // Añadir dropdown y botón al chat
      selectDiv.appendChild(select);
      selectDiv.appendChild(selectButton);
      chatBody.appendChild(selectDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    });
  } else {
    showTypingAndRespond(translations[currentLanguage].describeMore);
  }
}

  // Mostrar notificación
  function showNotification(message, duration = 2000) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, duration);
  }

  // Eventos
  sendButton.addEventListener('click', () => {
    log('Clic en sendButton');
    if (!isBotTyping && !sendButton.disabled) {
      processUserInput(chatInput.value);
    }
  });

  chatInput.addEventListener('input', () => {
    updateSendButtonState();
    adjustTextareaHeight();
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) {
        processUserInput(chatInput.value);
      }
    }
  });

  voiceButton.addEventListener('click', () => {
    log('Clic en voiceButton');
    if (isBotTyping) return;
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = currentLanguage === 'es' ? 'es-CO' : 'en-US';
      recognition.onresult = (event) => {
        chatInput.value = event.results[0][0].transcript;
        if (!sendButton.disabled) {
          processUserInput(chatInput.value);
        }
      };
      recognition.onerror = () => {
        addMessage('bot', translations[currentLanguage].voiceError);
      };
      recognition.onend = () => {
        log('Reconocimiento de voz finalizado');
      };
      recognition.start();
    } catch (error) {
      logError('Error en reconocimiento de voz:', error);
      addMessage('bot', translations[currentLanguage].voiceNotAvailable);
    }
  });

  historyButton.addEventListener('click', () => {
    log('Clic en historyButton');
    if (isBotTyping) return;
    if (conversationHistory.length === 0) {
      addMessage('bot', translations[currentLanguage].noHistory);
      return;
    }
    const historyText = conversationHistory.map(msg =>
      `[${msg.timestamp}] ${msg.sender === 'bot' ? 'Bot' : 'Usuario'}: ${msg.text}`
    ).join('\n');
    addMessage('bot', historyText);
  });

  downloadButton.addEventListener('click', () => {
    log('Clic en downloadButton');
    if (isBotTyping) return;
    if (conversationHistory.length === 0) {
      addMessage('bot', translations[currentLanguage].noHistoryToDownload);
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," +
      "Timestamp,Sender,Message\n" +
      conversationHistory.map(msg => `${msg.timestamp},${msg.sender},${msg.text.replace(/,/g, '')}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'historial_chat.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  resetButton.addEventListener('click', () => {
    log('Clic en resetButton');
    if (isBotTyping) return;
    resetConversation();
  });

  function resetConversation() {
  userRole = null;
  selectedArea = null;
  conversationHistory = [];
  isChatInitialized = false; // Reiniciar bandera
  localStorage.removeItem('chatHistory');
  localStorage.removeItem('userRole');
  localStorage.removeItem('selectedArea');
  localStorage.removeItem('isChatInitialized');
  chatBody.innerHTML = '';
  addMessageWithButtons(translations[currentLanguage].welcome, [
    { text: translations[currentLanguage].technician, action: () => setRole('technician') },
    { text: translations[currentLanguage].engineer, action: () => setRole('engineer') }
  ]);
}

  // Inicializar
  chatInput.value = '';
  updateSendButtonState();
});