document.addEventListener('DOMContentLoaded', function() {
  // Variables para controlar los logs de manera granular
  const DEBUG_LOG = false;
  const DEBUG_ERROR = true;
  const DEBUG_WARN = false;

  function log(...args) {
    if (DEBUG_LOG) console.log(...args);
  }

  function logError(...args) {
    if (DEBUG_ERROR) console.error(...args);
  }

  function logWarn(...args) {
    if (DEBUG_WARN) console.warn(...args);
  }

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

  // Traducciones
  const translations = {
    es: {
      welcome: '¡Hola! Soy tu asistente técnico de INCOMELEC S.A.S. Estoy aquí para ayudarte a resolver problemas técnicos. ¿Eres técnico o ingeniero?',
      rolePrompt: 'Por favor, dime si eres técnico o ingeniero.',
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
      messageTooLong: 'Tu mensaje es demasiado largo. Por favor, escribe un mensaje de menos de 500 caracteres.',
      machineSuggestion: '¿Es un problema con la Máquina de entrada?',
      controlSuggestion: '¿Es un problema con el Control de acceso?',
      cacharroSuggestion: '¿Es un problema con el Cacharro?'
    },
    en: {
      welcome: 'Hello! I am your technical assistant from INCOMELEC S.A.S. I am here to help you solve technical issues. Are you a technician or an engineer?',
      rolePrompt: 'Please tell me if you are a technician or an engineer.',
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
      messageTooLong: 'Your message is too long. Please enter a message with less than 500 characters.',
      machineSuggestion: 'Is it an issue with the Entry Machine?',
      controlSuggestion: 'Is it an issue with Access Control?',
      cacharroSuggestion: 'Is it an issue with the Cacharro?'
    }
  };

  // Base de conocimiento de respaldo
  const fallbackKnowledgeBase = [
    {
      area: "Máquina de entrada",
      priority: "alta",
      description: "no lee el ticket",
      keywords: ["ticket", "lector", "no lee", "máquina"],
      solution_technician: "Limpia el lector con un paño seco y reinicia la máquina.",
      solution_engineer: "Verifica el log de errores en el panel de control y actualiza el firmware."
    }
  ];

  // Usar la variable global knowledgeBase o la de respaldo
  const knowledgeBase = window.knowledgeBase || fallbackKnowledgeBase;
  log('knowledgeBase cargada:', knowledgeBase);

  // Validar la base de conocimiento
  if (!knowledgeBase || !Array.isArray(knowledgeBase) || knowledgeBase.length === 0) {
    logError('Error: knowledgeBase no es válida o está vacía');
    addMessage('bot', translations[currentLanguage].kbError);
    return;
  }

  // Obtener áreas únicas
  const uniqueAreas = [...new Set(knowledgeBase.map(p => p.area))];
  log('Áreas únicas:', uniqueAreas);

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
    if (chatContainer.style.display === 'none') {
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
  });

  function updateSendButtonState() {
    sendButton.disabled = chatInput.value.trim() === '' || isBotTyping || !navigator.onLine;
    log('Estado del botón de enviar actualizado:', sendButton.disabled);
  }

  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    const content = chatInput.value;
    const numberOfLines = content === '' ? 1 : content.split('\n').length;
    const minHeight = parseFloat(getComputedStyle(chatInput).minHeight);
    const maxHeight = 150;

    if (numberOfLines <= 1) {
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

  chatInput.addEventListener('input', () => {
    updateSendButtonState();
    adjustTextareaHeight();
  });

  adjustTextareaHeight();

  closeButton.addEventListener('click', () => {
    log('Clic en closeButton');
    chatContainer.style.display = 'none';
  });

  function setRole(role) {
    log('Rol seleccionado:', role);
    userRole = role;
    addMessage('bot', translations[currentLanguage].roleSelected(role), 
      uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
    );
  }

  function setArea(area) {
    log('Área seleccionada:', area);
    selectedArea = area;
    addMessage('bot', translations[currentLanguage].areaSelected(area));
  }

  function addMessage(sender, text, options = []) {
    log(`Añadiendo mensaje: ${sender} - ${text}`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    if (sender === 'bot') {
      const img = document.createElement('img');
      img.src = 'images/IncomelecRounded.svg'; // Ruta original
      img.alt = 'Bot Avatar';
      const span = document.createElement('span');
      span.innerHTML = text;
      messageDiv.appendChild(img);
      messageDiv.appendChild(span);
    } else {
      messageDiv.textContent = text;
    }
    chatBody.appendChild(messageDiv);

    if (options.length) {
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
          }
        });
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
      showTypingAndRespond(translations[currentLanguage].rolePrompt);
      return;
    }

    if (!selectedArea) {
      showTypingAndRespond(translations[currentLanguage].areaPrompt, 
        uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
      );
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('máquina')) {
        showTypingAndRespond(translations[currentLanguage].machineSuggestion, [
          { text: translations[currentLanguage].yes, action: () => setArea('Máquina de entrada') },
          { text: translations[currentLanguage].no, action: () => addMessage('bot', translations[currentLanguage].areaPrompt) }
        ]);
      } else if (lowerInput.includes('control') || lowerInput.includes('tarjeta')) {
        showTypingAndRespond(translations[currentLanguage].controlSuggestion, [
          { text: translations[currentLanguage].yes, action: () => setArea('Control de acceso') },
          { text: translations[currentLanguage].no, action: () => addMessage('bot', translations[currentLanguage].areaPrompt) }
        ]);
      } else if (lowerInput.includes('cacharro') || lowerInput.includes('puerta')) {
        showTypingAndRespond(translations[currentLanguage].cacharroSuggestion, [
          { text: translations[currentLanguage].yes, action: () => setArea('Cacharro') },
          { text: translations[currentLanguage].no, action: () => addMessage('bot', translations[currentLanguage].areaPrompt) }
        ]);
      }
      return;
    }

    const areaProblems = knowledgeBase.filter(p => p.area === selectedArea);
    log('Problemas filtrados:', areaProblems);
    const problem = areaProblems.find(p => 
      p.keywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()))
    );
    log('Problema encontrado:', problem);
    if (problem) {
      const solution = userRole === 'technician' ? problem.solution_technician : problem.solution_engineer;
      showTypingAndRespond(translations[currentLanguage].problemDetected(problem.area, problem.priority, userRole, solution), [
        { text: translations[currentLanguage].yes, action: () => addMessage('bot', translations[currentLanguage].problemSolved) },
        { text: translations[currentLanguage].no, action: () => addMessage('bot', translations[currentLanguage].moreDetails) }
      ]);
    } else {
      showTypingAndRespond(translations[currentLanguage].problemNotRecognized);
    }
  }

  function showTypingAndRespond(text, options = []) {
    log('showTypingAndRespond iniciado con texto:', text);
    isBotTyping = true;
    updateSendButtonState();
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('typing-indicator');
    typingIndicator.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
    log('Indicador de escribiendo añadido al DOM');

    setTimeout(() => {
      try {
        log('Retraso de 1.5 segundos terminado');
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
          log('Indicador de escribiendo removido');
        } else {
          logWarn('Indicador de escribiendo no encontrado para remover');
        }
        isBotTyping = false;
        updateSendButtonState();
        addMessage('bot', text, options);
      } catch (error) {
        logError('Error dentro de setTimeout:', error);
        isBotTyping = false;
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
      chatInput.style.height = parseFloat(getComputedStyle(chatInput).minHeight) + 'px';
      chatInput.style.overflowY = 'hidden';
      updateSendButtonState();
      showNotification(translations[currentLanguage].messageSent);
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      log('Enter presionado');
      e.preventDefault();
      sendButton.click();
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
});