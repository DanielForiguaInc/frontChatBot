document.addEventListener('DOMContentLoaded', function() {
  // Variables para controlar los logs de manera granular
  const DEBUG_LOG = false;   // Para console.log (mensajes informativos)
  const DEBUG_ERROR = true; // Para console.error (errores)
  const DEBUG_WARN = false;  // Para console.warn (advertencias)

  // Función para manejar logs informativos
  function log(...args) {
    if (DEBUG_LOG) console.log(...args);
  }

  // Función para manejar errores
  function logError(...args) {
    if (DEBUG_ERROR) console.error(...args);
  }

  // Función para manejar advertencias
  function logWarn(...args) {
    if (DEBUG_WARN) console.warn(...args);
  }

  log('chatbot.js cargado correctamente');

  // Limpiar historial al iniciar una nueva sesión
  localStorage.removeItem('chatHistory');
  let conversationHistory = [];
  let hasShownWelcome = false;

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

  // Obtener áreas únicas
  const uniqueAreas = [...new Set(knowledgeBase.map(p => p.area))];
  log('Áreas únicas:', uniqueAreas);

  // Estado del bot
  let userRole = null;
  let selectedArea = null;
  let isBotTyping = false;

  // Elementos del DOM
  const chatBubble = document.getElementById('chatBubble');
  const chatContainer = document.getElementById('chatContainer');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const voiceButton = document.getElementById('voiceButton');
  const historyButton = document.getElementById('historyButton');
  const downloadButton = document.getElementById('downloadButton');
  const closeButton = document.getElementById('close-button');

  if (!chatBody || !chatInput || !sendButton) {
    logError('Error: No se encontraron elementos del DOM necesarios');
    return;
  }
  log('Elementos del DOM cargados correctamente');

  // Mostrar/Ocultar chat y mostrar mensaje de bienvenida la primera vez
  chatBubble.addEventListener('click', () => {
    log('Clic en chatBubble');
    if (chatContainer.style.display === 'none') {
      chatContainer.style.display = 'flex';
      if (!hasShownWelcome) {
        addMessage('bot', '¡Hola! Soy tu asistente técnico de INCOMELEC S.A.S. Estoy aquí para ayudarte a resolver problemas técnicos. ¿Eres técnico o ingeniero?', [
          { text: 'Técnico', action: () => setRole('technician') },
          { text: 'Ingeniero', action: () => setRole('engineer') }
        ]);
        hasShownWelcome = true;
      }
    } else {
      chatContainer.style.display = 'none';
    }
  });

  function updateSendButtonState() {
    sendButton.disabled = chatInput.value.trim() === '' || isBotTyping;
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
    addMessage('bot', `¡Perfecto, ${role === 'technician' ? 'técnico' : 'ingeniero'}! Vamos a ${role === 'technician' ? 'arreglar eso rápido' : 'revisar los detalles técnicos'}. ¿En qué área tienes el problema?`, 
      uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
    );
  }

  function setArea(area) {
    log('Área seleccionada:', area);
    selectedArea = area;
    addMessage('bot', `Seleccionaste ${area}. Describe el problema.`);
  }

  function addMessage(sender, text, options = []) {
    log(`Añadiendo mensaje: ${sender} - ${text}`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    if (sender === 'bot') {
      const img = document.createElement('img');
      img.src = 'images/IncomelecRounded1.svg';
      img.alt = 'Bot Avatar';
      const span = document.createElement('span');
      span.textContent = text;
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
    localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
  }

  function processUserInput(input) {
    log('processUserInput iniciado con input:', input);
    if (!input.trim()) {
      showTypingAndRespond('Por favor, describe el problema con más detalles, por ejemplo, "no lee el ticket".');
      return;
    }

    addMessage('user', input);

    if (!userRole) {
      showTypingAndRespond('Por favor, dime si eres técnico o ingeniero.');
      return;
    }

    if (!selectedArea) {
      showTypingAndRespond('Por favor, selecciona el área del problema.', 
        uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
      );
      return;
    }

    // Filtrar knowledgeBase por el área seleccionada
    const areaProblems = knowledgeBase.filter(p => p.area === selectedArea);
    log('Problemas filtrados:', areaProblems);
    const problem = areaProblems.find(p => 
      p.keywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()))
    );
    log('Problema encontrado:', problem);
    if (problem) {
      const solution = userRole === 'technician' ? problem.solution_technician : problem.solution_engineer;
      showTypingAndRespond(`Problema detectado en ${problem.area} (Prioridad: ${problem.priority}). ${userRole === 'technician' ? 'Aquí tienes una solución práctica:' : 'Aquí está la solución técnica recomendada:'} ${solution} ¿Se resolvió el problema?`, [
        { text: 'Sí', action: () => addMessage('bot', '¡Genial! ¿Necesitas ayuda con algo más?') },
        { text: 'No', action: () => addMessage('bot', 'Por favor, describe más detalles o contacta a soporte.') }
      ]);
    } else {
      showTypingAndRespond('No reconozco ese problema en el área seleccionada. Por favor, intenta describirlo de otra manera o proporciona más detalles, como "pantalla no enciende".');
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

  sendButton.addEventListener('click', () => {
    log('Clic en sendButton');
    const input = chatInput.value.trim();
    if (input && !isBotTyping) {
      processUserInput(input);
      chatInput.value = '';
      chatInput.style.height = parseFloat(getComputedStyle(chatInput).minHeight) + 'px';
      chatInput.style.overflowY = 'hidden';
      updateSendButtonState();
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
      recognition.lang = 'es-CO';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendButton.click();
        updateSendButtonState();
      };
      recognition.onerror = (event) => {
        addMessage('bot', 'Error en reconocimiento de voz. Usa texto, por favor.');
      };
      recognition.start();
    } catch (error) {
      logError('Error en reconocimiento de voz:', error);
      addMessage('bot', 'El reconocimiento de voz no está disponible en este navegador.');
    }
  });

  historyButton.addEventListener('click', () => {
    log('Clic en historyButton');
    if (isBotTyping) return;
    if (conversationHistory.length === 0) {
      addMessage('bot', 'No hay interacciones previas en esta sesión.');
      return;
    }
    const historyText = conversationHistory.map(msg => 
      `[${msg.timestamp}] ${msg.sender === 'bot' ? 'Bot' : 'Usuario'}: ${msg.text}`
    ).join('\n');
    addMessage('bot', 'Historial de la sesión:\n' + historyText);
  });

  downloadButton.addEventListener('click', () => {
    log('Clic en downloadButton');
    if (isBotTyping) return;
    if (conversationHistory.length === 0) {
      addMessage('bot', 'No hay historial para descargar.');
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
});