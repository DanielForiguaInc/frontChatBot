document.addEventListener('DOMContentLoaded', function() {
  // Variables para controlar los logs de manera granular
  const DEBUG_LOG = false;
  const DEBUG_ERROR = true;
  const DEBUG_WARN = false;

  function log(...args) { if (DEBUG_LOG) console.log(...args); }
  function logError(...args) { if (DEBUG_ERROR) console.error(...args); }
  function logWarn(...args) { if (DEBUG_WARN) console.warn(...args); }

  log('chatbot.js cargado correctamente');

  // Limpiar historial al iniciar una nueva sesión
  localStorage.removeItem('chatHistory');
  let conversationHistory = [];
  let hasShownWelcome = false;

  // Estado del bot
  let userRole = null;
  let selectedArea = null;
  let isBotTyping = false;
  let currentLanguage = 'es';
  let availableAreas = [];

  // Cargar áreas dinámicas desde el backend al iniciar
  function loadAreas() {
    fetch('http://127.0.0.1:5000/api/areas')
      .then(response => response.json())
      .then(data => {
        availableAreas = data.areas;
        log('Áreas cargadas desde el backend:', availableAreas);
      })
      .catch(error => {
        logError('Error al cargar áreas:', error);
        availableAreas = ["Máquina de entrada", "Talanquera", "Control de acceso"]; // Fallback
        logWarn('Usando áreas de respaldo:', availableAreas);
      });
  }
  loadAreas();

  // Traducciones
  const translations = {
    es: {
      welcome: '¡Hola! Soy tu asistente técnico de INCOMELEC S.A.S. Estoy aquí para ayudarte a resolver problemas técnicos. ¿Eres técnico o ingeniero?',
      rolePrompt: 'Por favor, selecciona tu rol: técnico o ingeniero.',
      technician: 'Técnico',
      engineer: 'Ingeniero',
      roleSelected: (role) => `¡Perfecto, ${role === 'technician' ? 'técnico' : 'ingeniero'}! Vamos a ${role === 'technician' ? 'arreglar eso rápido' : 'revisar los detalles técnicos'}. ¿En qué área tienes el problema?`,
      areaPrompt: 'Por favor, selecciona el área del problema.',
      areaSelected: (area) => `Seleccionaste ${area}. Describe el problema.`,
      describeMore: 'Por favor, describe el problema con más detalles, por ejemplo, "no lee el ticket".',
      problemNotRecognized: 'No reconozco ese problema en el área seleccionada. Por favor, intenta describirlo de otra manera o proporciona más detalles, como "pantalla no enciende".',
      problemDetected: (area, priority, role, solution) => `Problema detectado en ${area} (Prioridad: ${priority}). <br><strong>${role === 'technician' ? 'Solución práctica:' : 'Solución técnica:'}</strong> ${solution} <br>¿Se resolvió el problema?`,
      yes: 'Sí',
      no: 'No',
      problemSolved: '¡Genial! ¿Necesitas ayuda con algo más?',
      moreDetails: 'Por favor, describe más detalles o contacta a soporte.',
      voiceError: 'Error en reconocimiento de voz. Usa texto, por favor.',
      voiceNotAvailable: 'El reconocimiento de voz no está disponible en este navegador.',
      noHistory: 'No hay interacciones previas en esta sesión.',
      historyTitle: 'Historial de la sesión:\n',
      noHistoryToDownload: 'No hay historial para descargar.',
      messageSent: 'Mensaje enviado',
      connectionLost: 'Conexión perdida',
      connectionRestored: 'Conexión restablecida',
      kbError: 'Lo siento, no puedo acceder a la base de conocimiento en este momento. Por favor, contacta a soporte.',
      emptyMessage: 'Por favor, escribe un mensaje válido.',
      messageTooLong: 'Tu mensaje es demasiado largo. Por favor, escribe un mensaje de menos de 500 caracteres.'
    },
    en: {
      welcome: 'Hello! I am your technical assistant from INCOMELEC S.A.S. I am here to help you solve technical issues. Are you a technician or an engineer?',
      rolePrompt: 'Please select your role: technician or engineer.',
      technician: 'Technician',
      engineer: 'Engineer',
      roleSelected: (role) => `Great, ${role === 'technician' ? 'technician' : 'engineer'}! Let’s ${role === 'technician' ? 'fix that quickly' : 'review the technical details'}. In which area are you having the issue?`,
      areaPrompt: 'Please select the area of the issue.',
      areaSelected: (area) => `You selected ${area}. Describe the issue.`,
      describeMore: 'Please describe the issue in more detail, for example, "the ticket is not being read."',
      problemNotRecognized: 'I don’t recognize that issue in the selected area. Please try describing it differently or provide more details, like "the screen won’t turn on."',
      problemDetected: (area, priority, role, solution) => `Issue detected in ${area} (Priority: ${priority}). <br><strong>${role === 'technician' ? 'Practical Solution:' : 'Technical Solution:'}</strong> ${solution} <br>Was the issue resolved?`,
      yes: 'Yes',
      no: 'No',
      problemSolved: 'Great! Do you need help with anything else?',
      moreDetails: 'Please provide more details or contact support.',
      voiceError: 'Error in voice recognition. Please use text instead.',
      voiceNotAvailable: 'Voice recognition is not available in this browser.',
      noHistory: 'There are no previous interactions in this session.',
      historyTitle: 'Session History:\n',
      noHistoryToDownload: 'There is no history to download.',
      messageSent: 'Message sent',
      connectionLost: 'Connection lost',
      connectionRestored: 'Connection restored',
      kbError: 'Sorry, I cannot access the knowledge base at this moment. Please contact support.',
      emptyMessage: 'Please enter a valid message.',
      messageTooLong: 'Your message is too long. Please enter a message with less than 500 characters.'
    }
  };

  // Elementos del DOM
  const chatBubble = document.getElementById('chatBubble');
  if (chatBubble) {
      log('chatBubble encontrado en el DOM:', {
        style: chatBubble.style,
        computedStyle: window.getComputedStyle(chatBubble),
        position: chatBubble.getBoundingClientRect()
      });
    } else {
      logError('chatBubble no encontrado en el DOM');
    }
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

  if (!chatBody || !chatInput || !sendButton || !resetButton || !themeToggle || !languageButton || !notification) {
    logError('Error: No se encontraron elementos del DOM necesarios');
    return;
  }
  log('Elementos del DOM cargados correctamente');

  // Función para deshabilitar interacciones con imágenes y elementos con fondos
  function disableImageInteractions(element) {
    if (element.tagName === 'IMG') {
      element.setAttribute('ondragstart', 'return false');
      element.setAttribute('onselectstart', 'return false');
      element.setAttribute('draggable', 'false');
      element.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    } else if (element.classList.contains('btn')) {
      element.setAttribute('ondragstart', 'return false');
      element.setAttribute('onselectstart', 'return false');
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      element.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
  }

  // Aplicar restricciones a imágenes y botones existentes
  document.querySelectorAll('img, .btn').forEach(disableImageInteractions);

  // Observador de mutaciones para detectar nuevos elementos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG' || node.classList.contains('btn')) {
            disableImageInteractions(node);
          }
          node.querySelectorAll('img, .btn').forEach(disableImageInteractions);
        }
      });
    });
  });

  // Observar cambios en el body
  observer.observe(document.body, { childList: true, subtree: true });

  // Modo oscuro/claro
  let isDarkMode = false;
  themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.classList.toggle('dark-mode', isDarkMode);
  });

  // Selector de idioma (simulado con botón)
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

  // Mostrar/Ocultar chat y mostrar mensaje de bienvenida la primera vez
  chatBubble.addEventListener('click', () => {
      log('Clic en chatBubble');
      const currentDisplay = chatContainer.style.display;
      if (currentDisplay === 'none' || currentDisplay === '') {
        chatContainer.style.display = 'flex';
        if (!hasShownWelcome) {
          addMessage('bot', translations[currentLanguage].welcome, [
            { text: translations[currentLanguage].technician, action: () => setRole('technician') },
            { text: translations[currentLanguage].engineer, action: () => setRole('engineer') }
          ]);
          hasShownWelcome = true;
        }
      } else {
        chatContainer.style.display = 'none';
      }
      log('Estado de chatBubble tras clic:', {
        style: chatBubble.style,
        computedStyle: window.getComputedStyle(chatBubble),
        position: chatBubble.getBoundingClientRect()
      });
    });

  function updateSendButtonState() {
    const isDisabled = chatInput.value.trim() === '' || isBotTyping || !navigator.onLine;
    sendButton.disabled = isDisabled;
    log('Estado del botón de enviar actualizado:', {
      disabled: isDisabled,
      value: chatInput.value,
      valueLength: chatInput.value.trim().length,
      isBotTyping: isBotTyping,
      online: navigator.onLine,
      sendButtonDisabled: sendButton.disabled // Verificar el estado real del botón
    });
  }

  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    const content = chatInput.value;
    const numberOfLines = content === '' ? 1 : content.split('\n').length;
    const minHeight = parseFloat(getComputedStyle(chatInput).minHeight);
    const maxHeight = 150;

    if (content === '') {
      chatInput.style.height = `${minHeight}px`; // Forzar minHeight cuando está vacío
      chatInput.style.overflowY = 'hidden';
    } else if (numberOfLines <= 1) {
      chatInput.style.height = `${minHeight}px`;
      chatInput.style.overflowY = 'hidden';
    } else {
      const newHeight = Math.min(chatInput.scrollHeight, maxHeight);
      chatInput.style.height = `${newHeight}px`;
      if (chatInput.scrollHeight > maxHeight) {
        chatInput.style.overflowY = 'auto';
        chatInput.scrollTop = chatInput.scrollHeight;
      } else {
        chatInput.style.overflowY = 'hidden';
      }
    }
  }

  adjustTextareaHeight();

  closeButton.addEventListener('click', () => {
    log('Clic en closeButton');
    chatContainer.style.display = 'none';
  });

  function setRole(role) {
    userRole = role;
    addMessage('bot', translations[currentLanguage].roleSelected(role), availableAreas.map(area => ({
      text: area,
      action: () => setArea(area)
    })));
  }

  function setArea(area) {
    log('Área seleccionada:', area);
    selectedArea = area;
    addMessage('bot', translations[currentLanguage].areaSelected(area));
  }

  // Función para añadir mensajes al chat
  function addMessage(sender, text, options = []) {
    log(`Añadiendo mensaje: ${sender} - ${text}`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    if (sender === 'bot') {
      const img = document.createElement('img');
      img.src = 'assets/Images/IncomelecRounded.svg'; // Asegúrate de que la ruta sea correcta
      img.alt = 'Bot Avatar';
      const span = document.createElement('span');
      span.innerHTML = text;
      messageDiv.appendChild(img);
      messageDiv.appendChild(span);
    } else {
      messageDiv.textContent = text;
    }
    chatBody.appendChild(messageDiv);

    if (options.length && !userRole) { // Solo añadir opciones si no se ha seleccionado rol
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'chat-options';
      options.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = opt.text;
        button.addEventListener('click', () => {
          if (!isBotTyping) {
            log('Opción seleccionada:', opt.text);
            opt.action();
            isBotTyping = false;
            updateSendButtonState();
          }
        }); // Removido { once: true } para probar
        optionsDiv.appendChild(button);
      });
      chatBody.appendChild(optionsDiv);
    } else if (options.length && userRole) { // Para áreas u otras opciones después de seleccionar rol
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'chat-options';
      options.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = opt.text;
        button.addEventListener('click', () => {
          if (!isBotTyping) {
            log('Opción seleccionada:', opt.text);
            opt.action();
            isBotTyping = false;
            updateSendButtonState();
          }
        }); // Removido { once: true } para probar
        optionsDiv.appendChild(button);
      });
      chatBody.appendChild(optionsDiv);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
    conversationHistory.push({ sender, text, timestamp: new Date().toISOString() });
    try {
      localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    } catch (error) {
      logError('Error al guardar en localStorage:', error);
    }
    updateSendButtonState(); // Asegurar que el estado del botón se actualice tras cada mensaje
  }

  function processUserInput(input) {
    log('processUserInput iniciado con input:', input);
    input = input.trim();
    if (!input) {
      showTypingAndRespond(translations[currentLanguage].emptyMessage);
      return;
    }
    if (input.length > 500) {
      showTypingAndRespond(translations[currentLanguage].messageTooLong);
      return;
    }

    addMessage('user', input);

    if (!userRole) {
      showTypingAndRespond(translations[currentLanguage].rolePrompt, [
        { text: translations[currentLanguage].technician, action: () => setRole('technician') },
        { text: translations[currentLanguage].engineer, action: () => setRole('engineer') }
      ]);
      return;
    }

    fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, userRole, selectedArea, currentLanguage })
    })
    .then(response => response.json())
    .then(data => {
      showTypingAndRespond(data.response, data.options ? data.options.map(opt => ({
        text: opt.text,
        action: () => {
          if (opt.action.startsWith('setArea:')) {
            setArea(opt.action.split(':')[1]);
          } else if (opt.action === 'prompt') {
            addMessage('bot', translations[currentLanguage].areaPrompt);
          } else if (opt.action === 'solved') {
            addMessage('bot', translations[currentLanguage].problemSolved);
          } else if (opt.action === 'details') {
            addMessage('bot', translations[currentLanguage].moreDetails);
          }
        }
      })) : []);
    })
    .catch(() => showTypingAndRespond("Error al conectar con el servidor. Intenta de nuevo."));
  }

  function showTypingAndRespond(text, options = []) {
    log('showTypingAndRespond iniciado con texto:', text);
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
    log('Indicador de escribiendo añadido al DOM');

    setTimeout(() => {
      try {
        if (typingIndicator.parentNode) {
          typingIndicator.remove();
        }
        isBotTyping = false; // Reseteo garantizado
        updateSendButtonState(); // Actualización tras reseteo
        addMessage('bot', text, options);
      } catch (error) {
        logError('Error dentro de setTimeout:', error);
        isBotTyping = false; // Reseteo en caso de error
        updateSendButtonState();
        addMessage('bot', 'Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.');
      }
    }, 1500);
  }

  function showNotification(message, duration = 2000) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, duration);
  }

  sendButton.addEventListener('click', () => {
    log('Clic en sendButton');
    const input = chatInput.value.trim();
    if (input && !isBotTyping) {
      processUserInput(input);
      chatInput.value = '';
      updateSendButtonState();
      adjustTextareaHeight(); // Añadir ajuste de altura tras limpiar
    }
  });

  chatInput.addEventListener('input', () => {
    updateSendButtonState();
    adjustTextareaHeight();
  });

  chatInput.addEventListener('keydown', (e) => {
    log('Tecla presionada:', e.key, e.shiftKey);
    if (e.key === 'Enter' && !e.shiftKey) {
      log('Enter presionado sin Shift, simulando clic en sendButton');
      e.preventDefault();
      sendButton.click(); // Eliminar la verificación if (!sendButton.disabled)
      updateSendButtonState();
    }
  });

  voiceButton.addEventListener('click', () => {
    log('Clic en voiceButton');
    if (isBotTyping) return;
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = currentLanguage === 'es' ? 'es-CO' : 'en-US';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendButton.click();
        updateSendButtonState();
      };
      recognition.onerror = (event) => {
        logError('Error en reconocimiento de voz (onerror):', event.error);
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
    addMessage('bot', translations[currentLanguage].historyTitle + historyText);
  });

  downloadButton.addEventListener('click', () => {
    log('Clic en downloadButton');
    if (isBotTyping) return;
    if (conversationHistory.length === 0) {
      addMessage('bot', translations[currentLanguage].noHistoryToDownload);
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Sender,Message\n"
      + conversationHistory.map(msg => `${msg.timestamp},${msg.sender},${msg.text.replace(/,/g, '')}`).join('\n');
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
    localStorage.removeItem('chatHistory');
    chatBody.innerHTML = '';
    hasShownWelcome = false;
    addMessage('bot', translations[currentLanguage].welcome, [
      { text: translations[currentLanguage].technician, action: () => setRole('technician') },
      { text: translations[currentLanguage].engineer, action: () => setRole('engineer') }
    ]);
    hasShownWelcome = true;
  }

  // Inicializar el estado del botón al cargar
  window.addEventListener('load', () => {
    chatInput.value = ''; // Asegurar que esté vacío al inicio
    updateSendButtonState();
  });
});