document.addEventListener('DOMContentLoaded', function() {
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

  // Obtener áreas únicas
  const uniqueAreas = [...new Set(knowledgeBase.map(p => p.area))];

  // Estado del bot
  let userRole = null;
  let selectedArea = null;

  // Elementos del DOM
  const chatBubble = document.getElementById('chatBubble');
  const chatContainer = document.getElementById('chatContainer');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const voiceButton = document.getElementById('voiceButton');
  const historyButton = document.getElementById('historyButton');
  const downloadButton = document.getElementById('downloadButton');
  const closeButton = document.getElementById('close-button'); // Actualizado a close-button

  // Mostrar/Ocultar chat y mostrar mensaje de bienvenida la primera vez
  chatBubble.addEventListener('click', () => {
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
  sendButton.disabled = chatInput.value.trim() === '';
}

chatInput.addEventListener('input', updateSendButtonState);
// Inicializa el estado
updateSendButtonState();

  // Cerrar chat
  closeButton.addEventListener('click', () => {
    chatContainer.style.display = 'none';
  });

  // Configurar el rol del usuario y luego pedir el área
  function setRole(role) {
    userRole = role;
    addMessage('bot', `¡Perfecto, ${role === 'technician' ? 'técnico' : 'ingeniero'}! Vamos a ${role === 'technician' ? 'arreglar eso rápido' : 'revisar los detalles técnicos'}. ¿En qué área tienes el problema?`, 
      uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
    );
  }

  // Configurar el área seleccionada
  function setArea(area) {
    selectedArea = area;
    addMessage('bot', `Seleccionaste ${area}. Describe el problema.`);
  }

  // Añadir mensaje al chat
  function addMessage(sender, text, options = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender === 'bot' ? 'bot-message' : 'user-message'}`;
    if (sender === 'bot') {
      const img = document.createElement('img');
      img.src = 'images/bot-avatar.jpg';
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
        button.addEventListener('click', opt.action);
        optionsDiv.appendChild(button);
      });
      chatBody.appendChild(optionsDiv);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
    conversationHistory.push({ sender, text, timestamp: new Date().toISOString() });
    localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
  }

  // Procesar entrada del usuario
  function processUserInput(input) {
    if (!input.trim()) {
      addMessage('bot', 'Por favor, describe el problema con más detalles, por ejemplo, "no lee el ticket".');
      return;
    }

    addMessage('user', input);
    if (!userRole) {
      if (input.toLowerCase().includes('técnico')) {
        setRole('technician');
      } else if (input.toLowerCase().includes('ingeniero')) {
        setRole('engineer');
      } else {
        addMessage('bot', 'Por favor, dime si eres técnico o ingeniero.');
      }
      return;
    }

    if (!selectedArea) {
      addMessage('bot', 'Por favor, selecciona el área del problema.', 
        uniqueAreas.map(area => ({ text: area, action: () => setArea(area) }))
      );
      return;
    }

    // Filtrar knowledgeBase por el área seleccionada
    const areaProblems = knowledgeBase.filter(p => p.area === selectedArea);
    const problem = areaProblems.find(p => 
      p.keywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (problem) {
      const solution = userRole === 'technician' ? problem.solution_technician : problem.solution_engineer;
      addMessage('bot', `Problema detectado en ${problem.area} (Prioridad: ${problem.priority}). ${userRole === 'technician' ? 'Aquí tienes una solución práctica:' : 'Aquí está la solución técnica recomendada:'} ${solution} ¿Se resolvió el problema?`, [
        { text: 'Sí', action: () => addMessage('bot', '¡Genial! ¿Necesitas ayuda con algo más?') },
        { text: 'No', action: () => addMessage('bot', 'Por favor, describe más detalles o contacta a soporte.') }
      ]);
    } else {
      addMessage('bot', 'No reconozco ese problema en el área seleccionada. Por favor, intenta describirlo de otra manera o proporciona más detalles, como "pantalla no enciende".');
    }
  }

  // Enviar mensaje al presionar Enter o el botón
  sendButton.addEventListener('click', () => {
    const input = chatInput.value.trim();
    if (input) {
      processUserInput(input);
      chatInput.value = '';
    }
  });
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

  // Soporte para voz (Web Speech API)
  voiceButton.addEventListener('click', () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'es-CO';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
        sendButton.click();
      };
      recognition.onerror = (event) => {
        addMessage('bot', 'Error en reconocimiento de voz. Usa texto, por favor.');
      };
      recognition.start();
    } catch (error) {
      addMessage('bot', 'El reconocimiento de voz no está disponible en este navegador.');
    }
  });

  // Mostrar historial
  historyButton.addEventListener('click', () => {
    if (conversationHistory.length === 0) {
      addMessage('bot', 'No hay interacciones previas en esta sesión.');
      return;
    }
    const historyText = conversationHistory.map(msg => 
      `[${msg.timestamp}] ${msg.sender === 'bot' ? 'Bot' : 'Usuario'}: ${msg.text}`
    ).join('\n');
    addMessage('bot', 'Historial de la sesión:\n' + historyText);
  });

  // Descargar historial como CSV
  downloadButton.addEventListener('click', () => {
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