document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM completamente cargado');
  const tempUsers = {
    soporte: { username: 'soporte', password: 'S0p0rt3_S3gur0!', role: 'support' },
    mantenimiento: { username: 'mantenimiento', password: 'M4nt3n_S3gur0!', role: 'maintenance' }
  };

  // Configuración de logs
  const DEBUG_LOG = true;
  const DEBUG_ERROR = true;
  const DEBUG_WARN = false;

  function log(...args) { if (DEBUG_LOG) console.log(...args); }
  function logError(...args) { if (DEBUG_ERROR) console.error(...args); }
  function logWarn(...args) { if (DEBUG_WARN) console.warn(...args); }

  log('chatbot.js cargado correctamente');

  // Áreas válidas
  const validAreas = ['talanquera', 'cajero', 'datafono', 'mantenimiento', 'TVM', 'Aeropuerto'];

  // Keywords organizadas por área, basadas en el JSON del backend
  const commonKeywordsByArea = {
    talanquera: [
      'Adaptación', 'Skidata', 'Horus', 'Incomelec', 'Guía', 'I+D+i', 'Tarjeta', 'Controladora',
      'Encoder', 'Pictograma', 'CONTOUR', 'Bus', '24Vcc', 'Entradas', 'Salidas', 'Software',
      'Selector', 'Modo', 'Bomera', 'Pulsos', 'Boot', 'OEM', 'Automática', 'Semiautomática',
      'Señal', 'Loop', 'Firmware', 'LEDs', 'CHANGE_OUTPUT', 'Abierto', 'Cerrado', 'Captura',
      'Ciclo', 'Parqueadero', 'Errores', 'Posicionamiento', 'f3080', 'bloqueada', 'batería',
      'hoja', 'tornillos', 'laterales', 'tapa', 'placa', 'sensor', 'interior', 'pieza', 'trasera',
      'limpiar', 'Moovi', 'barrera', 'electromecánica', 'mástil', 'muelle', 'cimentación',
      'fotocélula', 'lampeggiante', 'receptor', 'radiocomando', 'memorización', 'transmisor',
      'cancelación', 'SW1', 'SW2', 'DL1', 'trimmer', 'diagnóstico', 'desbloqueo', 'emergencia',
      'actuador', 'programación', 'canal', 'Rolling', 'Replay', 'clonación', 'programador',
      'antena', 'coaxial', 'RG58', 'engrane', 'reductor', 'condensador', 'apertura', 'cierre',
      'automatización', 'peatonal', 'fijación', 'pulsador', 'intermitente', 'lubricación',
      'resorte', 'contacto', 'desgaste', 'soporte', 'inversión', 'fusible', 'aislamiento'
    ],
    cajero: [
      'validador', 'monedas', 'clasificación', 'mecanismo', 'colector', 'canales', 'interruptores',
      'firmware', 'latido', 'canaleta', 'anulación', 'configuración', 'memoria', 'diagnóstico',
      'ccTalk', 'sensores', 'aceptación', 'rechazo', 'trayectoria', 'cubierta', 'solenoide',
      'dimensiones', 'baudios', 'protocolo', 'montaje', 'tolerancia', 'cadena', 'reconocimiento',
      'enseñanza', 'estrecho', 'DIL', 'modo', 'calibración', 'bloquememoria', 'disparo', 'destello',
      'limpieza', 'residuos', 'cepillo', 'húmedo', 'validación', 'atasco', 'actualización',
      'interfaz', 'tornillos', 'tapa', 'placa', 'sensor', 'interior', 'pieza', 'reciclador',
      'trasera', 'táctil', 'cajero', 'panel', 'convertidor', 'HDMI', 'VGA', 'chip', 'EETI',
      'EXC80Hxx', 'I2C', 'RTPC190F1', 'flex', 'cristal', 'transparente', 'hub', 'enmascarar',
      'eGalax', 'eGalaxUpdate2', 'eGalaxCalibration', 'demo', 'marcador', 'espejo', 'objetivo',
      'presión', 'proyección', 'pantalla', 'frontal', 'bordes', 'tapadera', 'vidrio', 'montaje',
      'doblefaz', 'software', 'USB', 'admin', 'cancelar', 'esc', 'calibrador'
    ],
    datafono: [
      'datafono', 'soporte', 'flojo', 'peligro'
    ],
    TVM: [
      'Ubuntu', 'VirtualBox', 'VMware', 'QT', 'Creator', 'Framework', 'CQtDeployer', 'Toolchain',
      'qmake', 'Configuration', 'lupdate', 'lrelease', 'Deployment', 'Build', 'mvr', 'cnet',
      'configFTP', 'libNPrint', 'udev', 'Snap', 'makeSelf', 'app', 'Application', 'UPDATEGENERATOR',
      'toolchain', 'instalador', 'libopencv', 'libqt5core5a', 'libqt5gui5', 'libqt5widgets5',
      'libcrypto', 'libhidapi', 'libmysqlcppconn', 'openjdk', 'gstreamer', 'Recompilación',
      'Despliegue', 'Traducciones', 'Release', 'Mode', 'Maintenance', 'Script', 'Reader', 'EMV',
      'Impresora', 'archivos', 'param', 'installUpdate', 'updater', 'configuracionType',
      'aplicaciones', 'mvrQuito', 'mvrMCC', 'terminal', 'comando', 'arranque', 'cierre', 'Quito',
      'horus_adm1', 'teclado', 'PC', 'industrial', 'showroom', 'versión', 'manual', 'técnico',
      'pausa', 'instalacion', 'chmod', 'configuración', 'red', 'sonido', 'privacidad', 'zip',
      'descompresión', 'UPS', 'Login', 'PowerMaster', 'Jonathan', 'Rojas', 'Ricardo', 'Monroy',
      'departamento', 'producción', 'dirección', 'máscara', 'subred', 'gateway', 'servidor',
      'DNS', 'over', 'amplification', 'screen', 'lock', 'keyboard', 'layout', 'input', 'source'
    ],
    General: [
      'Winpark', 'Empresas', 'ID', 'parqueadero', 'número', 'caja', 'Ctrl', 'Alt', 'Spark',
      'Pparking', 'registradora', 'conexión', 'perdida', 'fallo', 'segmento', 'GDB', 'Windows',
      'Defender', 'puerto', 'comandos', 'configuración', 'reinicio', 'Firebird', 'asistencia'
    ],
    Aeropuerto: [
      'eGates', 'migratorios', 'aeropuerto', 'Guayaquil', 'mantenimiento', 'soporte', 'producción',
      'mesa', 'ayuda', 'TAGSA', 'Zohodesk', 'casos', 'diagnóstico', 'novedad', 'incidencias',
      'intervención', 'componentes', 'interfaz', 'inventario', 'cronograma', 'reporte', 'plazos',
      'prioridad', 'actualizaciones', 'inspección', 'periódica', 'lectores', 'pantallas', 'firmware',
      'verificación', 'obstáculo', 'esclusa', 'gabinete', 'paneles', 'vidrio', 'pictogramas',
      'rodamiento', 'DIRAS', 'celda', 'ventilador', 'rejilla', 'fusibles', 'voltaje', 'UPS',
      'pasillo', 'anomalía', 'freno', 'lubricante', 'desengrasante', 'multímetro', 'cautín',
      'maleta', 'flexómetro', 'brístol', 'torpedo', 'bisturí', 'microfibra', 'silicona', 'desgaste',
      'alineación', 'conectores', 'parlante', 'reemplazo', 'térmico', 'interruptor', 'tarjeta',
      'baterías', 'cámara', 'multitoma', 'simulador', 'certificación', 'checklist', 'revisión',
      'diaria', 'mensual', 'limpieza', 'semanal', 'mayor'
    ],
  };

  // Lista de palabras comunes a excluir (artículos, preposiciones, palabras genéricas)
  const stopWords = [
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'con', 'por', 'para', 'y', 'o', 'al',
    'tengo', 'problema', 'intentar', 'usar', 'es', 'que', 'a', 'se', 'del', 'como', 'cuando',
    'esto', 'esta', 'este', 'hacer', 'no', 'si', 'sí', 'me', 'mi', 'lo', 'le', 'una', 'uno',
    'Hola', 'adiós', 'gracias', 'por favor', 'bueno', 'bien', 'mal', 'sí', 'no', 'tal vez',
    'quizás', 'ok', 'vale', 'claro', 'perfecto', 'entendido', 'listo', 'listos', 'listo',
    'listos', 'dias', 'tardes', 'noches', 'mañana', 'ayer', 'hoy', 'pasa', 'ocurre', 'sucede'
  ];

  // Estado del bot
  let isBotTyping = false;
  let selectedArea = null;
  let userRole = null;
  localStorage.removeItem('userRole');
  localStorage.removeItem('selectedArea');
  let currentLanguage = 'es';
  let conversationHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  let isChatInitialized = false;

  // Inicializar estado desde localStorage
  userRole = localStorage.getItem('userRole') || null;
  selectedArea = localStorage.getItem('selectedArea') || null;

  // Traducciones
  const translations = {
    es: {
      welcome: '¡Hola! Soy tu asistente técnico de INCOMELEC S.A.S. Selecciona tu rol para comenzar.',
      rolePrompt: 'Por favor, selecciona tu rol: Interno o Externo.',
      areaPrompt: 'Por favor, selecciona un área del problema.',
      describeMore: 'Por favor, describe el problema con más detalles usando palabras técnicas específicas (por ejemplo, "Toolchain", "VirtualBox", "validador", "táctil").',
      problemNotRecognized: 'No reconozco ese problema. Intenta con palabras técnicas específicas del área seleccionada, como "Toolchain", "VirtualBox", "validador" o "táctil".',
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
      pleasureToHelp: 'Fue un placer ayudarte.',
      loginError: 'Error al iniciar sesión. Por favor, verifica tus credenciales.'
    },
    en: {
      welcome: 'Hello! I am your technical assistant from INCOMELEC S.A.S. Select your role to start.',
      rolePrompt: 'Please select your role: Internal or External.',
      areaPrompt: 'Please select the area of the issue.',
      describeMore: 'Please describe the issue in more detail using specific technical terms (e.g., "Toolchain", "VirtualBox", "validator", "touchscreen").',
      problemNotRecognized: 'I don’t recognize that issue. Try specific technical terms for the selected area, like "Toolchain", "VirtualBox", "validator", or "touchscreen".',
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
      pleasureToHelp: 'It was a pleasure to help you.',
      loginError: 'Error logging in. Please check your credentials.'
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

  // Verificación de elementos esenciales del DOM
  if (!chatBody || !chatInput || !sendButton || !resetButton || !themeToggle || !languageButton || !notification || !chatBubble || !chatContainer || !closeButton) {
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

  // Función para inicializar el formulario de login
  function initializeLoginForm(formElement) {
    if (!formElement) {
      logError('No se encontró el formulario de login para inicializar');
      return;
    }
    log('Inicializando formulario de login');
    
    // Remover manejadores previos para evitar duplicados
    const newForm = formElement.cloneNode(true);
    formElement.parentNode.replaceChild(newForm, formElement);
    
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      log('Formulario de login enviado');
      const emailInput = newForm.querySelector('#exampleDropdownFormEmail2');
      const passwordInput = newForm.querySelector('#exampleDropdownFormPassword2');
      
      if (!emailInput || !passwordInput) {
        logError('No se encontraron los campos de email o contraseña');
        addMessage('bot', translations[currentLanguage].loginError);
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      const emailPattern = /^(soporte|mantenimiento)$/;
      if (!emailPattern.test(email)) {
        logError('Usuario inválido:', email);
        addMessage('bot', 'El usuario debe ser "soporte" o "mantenimiento".');
        return;
      }

      const user = Object.values(tempUsers).find(u => u.username === email && u.password === password);
      if (user) {
        log('Inicio de sesión exitoso para:', email, 'Rol:', user.role);
        window.setRole(user.role);
        const roleOptions = document.getElementById('roleOptions');
        if (roleOptions) {
          roleOptions.style.display = 'none';
        }
      } else {
        logError('Credenciales incorrectas para:', email);
        addMessage('bot', translations[currentLanguage].loginError);
      }
    });
  }

  // Mostrar/Ocultar chat y mensaje de bienvenida
  chatBubble.addEventListener('click', () => {
    log('Clic en chatBubble, isChatInitialized:', isChatInitialized, 'userRole:', userRole);
    const currentDisplay = chatContainer.style.display;
    if (currentDisplay === 'none' || currentDisplay === '') {
      chatContainer.style.display = 'flex';
      if (!isChatInitialized) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].welcome}</span>`;
        chatBody.appendChild(messageDiv);

        const roleOptions = document.createElement('div');
        roleOptions.id = 'roleOptions';
        roleOptions.innerHTML = `
          <div style="display: flex; align-items: center; gap: 5px; margin-top: 0.5rem; text-align: left;">
            <button class="btn btn-secondary btn-sm" style="background-color: #6c757d; border-color: #6c757d;" onclick="window.setRole('technician')">Externo</button>
            <div class="dropdown">
              <button type="button" class="btn btn-primary btn-sm dropdown-toggle" style="background-color: #006f32; border-color: #00973a;" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
                Interno
              </button>
              <ul class="dropdown-menu" style="min-width: 180px; position: absolute; z-index: 1000;">
                <li>
                  <div class="p-2">
                    <form id="loginForm" action="javascript:void(0)">
                      <div class="mb-2">
                        <label for="exampleDropdownFormEmail2" class="form-label text-muted" style="font-size: 0.78rem;">Usuario (soporte o soporte@dominio.com)</label>
                        <input type="text" class="form-control form-control-sm" id="exampleDropdownFormEmail2" placeholder="soporte o soporte@dominio.com" style="font-size: 0.78rem;" required pattern="^(soporte|mantenimiento)$">
                      </div>
                      <div class="mb-2">
                        <label for="exampleDropdownFormPassword2" class="form-label text-muted" style="font-size: 0.78rem;">Contraseña</label>
                        <input type="password" class="form-control form-control-sm" id="exampleDropdownFormPassword2" placeholder="Contraseña" style="font-size: 0.78rem;" required>
                      </div>
                      <div class="mb-2">
                        <div class="form-check">
                          <input type="checkbox" class="form-check-input" id="rememberMe">
                          <label class="form-check-label" for="rememberMe" style="font-size: 0.75rem;">Recordarme</label>
                        </div>
                      </div>
                      <button type="submit" class="btn btn-primary btn-sm" style="background-color: #006f32; border-color: #006f32;">Iniciar Sesión</button>
                    </form>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        `;
        chatBody.appendChild(roleOptions);

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
          initializeLoginForm(loginForm);
        } else {
          logError('No se encontró el formulario de login después de crearlo');
        }

        isChatInitialized = true;
        localStorage.setItem('isChatInitialized', 'true');
      } else if (userRole) {
        log('Usuario ya logueado, no se muestra mensaje de bienvenida');
      } else {
        // Verificar si el mensaje rolePrompt ya existe
        const existingPrompt = Array.from(chatBody.querySelectorAll('.bot-message')).some(
          msg => msg.textContent.includes(translations[currentLanguage].rolePrompt)
        );
        if (!existingPrompt) {
          log('Añadiendo mensaje rolePrompt');
          const messageDiv = document.createElement('div');
          messageDiv.className = 'bot-message role-prompt';
          messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].rolePrompt}</span>`;
          chatBody.appendChild(messageDiv);
        } else {
          log('Mensaje rolePrompt ya existe, no se añade');
        }
      }
    } else {
      chatContainer.style.display = 'none';
    }
    chatBody.scrollTop = chatBody.scrollHeight;
  });

  window.setRole = function(role) {
    const validRoles = ['technician', 'engineer', 'support', 'maintenance'];
    if (!validRoles.includes(role)) {
      addMessage('bot', 'Rol no reconocido. Por favor, selecciona un rol válido.');
      return;
    }

    userRole = role;
    localStorage.setItem('userRole', role);

    // Mostrar mensaje de bienvenida personalizado
    let welcomeMessage;
    if (currentLanguage === 'es') {
      welcomeMessage = `Bienvenido, ${role === 'support' ? 'soporte' : role === 'maintenance' ? 'mantenimiento' : role === 'technician' ? 'técnico' : 'ingeniero'}!`;
    } else {
      welcomeMessage = `Welcome, ${role === 'support' ? 'support' : role === 'maintenance' ? 'maintenance' : role === 'technician' ? 'technician' : 'engineer'}!`;
    }
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'bot-message';
    welcomeDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${welcomeMessage}</span>`;
    chatBody.appendChild(welcomeDiv);

    // Mostrar mensaje de selección de área
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].areaPrompt}</span>`;
    chatBody.appendChild(messageDiv);

    const selectDiv = document.createElement('div');
    selectDiv.className = 'custom-dropdown';

    const dropdownList = document.createElement('ul');
    dropdownList.className = 'dropdown-list';
    const areaIcons = {
      'talanquera': './assets/Images/talanquera.png',
      'cajero': './assets/Images/cajero.png',
      'datafono': './assets/Images/datafono.png',
      'mantenimiento': './assets/Images/mantenimiento.png',
      'TVM': './assets/Images/tvm.png',
      'Aeropuerto': './assets/Images/aeropuerto.png'
    };
    dropdownList.innerHTML = `
      <li class="dropdown-item" data-value="">Selecciona un área</li>
      ${validAreas.map(area => `
        <li class="dropdown-item" data-value="${area}">
          <img src="${areaIcons[area]}" alt="${area} icon" class="dropdown-icon">
          ${area.charAt(0).toUpperCase() + area.slice(1)}
        </li>
      `).join('')}
    `;

    const selectButton = document.createElement('button');
    selectButton.className = 'option-button';
    selectButton.textContent = 'Seleccionar';
    selectButton.addEventListener('click', () => {
      const selectedItem = dropdownList.querySelector('.dropdown-item.selected');
      if (selectedItem && selectedItem.dataset.value) {
        setArea(selectedItem.dataset.value);
        selectDiv.remove();
      } else {
        addMessage('bot', 'Por favor, selecciona un área antes de continuar.');
      }
    });

    dropdownList.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        dropdownList.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });

    selectDiv.appendChild(dropdownList);
    selectDiv.appendChild(selectButton);
    chatBody.appendChild(selectDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    updateSendButtonState();
  };

  function setArea(area) {
    selectedArea = area;
    localStorage.setItem('selectedArea', area);
    addMessage('bot', translations[currentLanguage].describeMore);
    updateSendButtonState();
  }

  closeButton.addEventListener('click', () => {
    log('Clic en closeButton');
    chatContainer.style.display = 'none';
  });

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

  function updateSendButtonState() {
    const isRoleSelected = userRole !== null;
    const isAreaSelected = selectedArea !== null;
    const isMessageWritten = chatInput.value.trim() !== '';
    const isDisabled = !isRoleSelected || !isAreaSelected || !isMessageWritten;
    sendButton.disabled = isDisabled;
  }

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

  // Función para extraer keywords
  function extractKeywords(input) {
    const words = input.split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()));
    let keywords = [];

    if (selectedArea && commonKeywordsByArea[selectedArea.toLowerCase()]) {
      const areaKeywords = commonKeywordsByArea[selectedArea.toLowerCase()];
      const matchedKeywords = words.filter(word => 
        areaKeywords.some(keyword => keyword.toLowerCase() === word.toLowerCase())
      ).map(word => {
        const matchedKeyword = areaKeywords.find(keyword => keyword.toLowerCase() === word.toLowerCase());
        return matchedKeyword || word;
      });
      keywords = keywords.concat(matchedKeywords);
    }

    if (keywords.length < 2 && commonKeywordsByArea.General) {
      const generalKeywords = commonKeywordsByArea.General;
      const matchedGeneralKeywords = words.filter(word => 
        !keywords.includes(word) && 
        generalKeywords.some(keyword => keyword.toLowerCase() === word.toLowerCase())
      ).map(word => {
        const matchedKeyword = generalKeywords.find(keyword => keyword.toLowerCase() === word.toLowerCase());
        return matchedKeyword || word;
      });
      keywords = keywords.concat(matchedGeneralKeywords);
    }

    if (keywords.length < 2) {
      const capitalizedWords = words.filter(word => 
        !keywords.includes(word) && /[A-Z]/.test(word[0]) && word.length > 3
      );
      keywords = keywords.concat(capitalizedWords);
    }

    if (keywords.length < 2) {
      const remainingWords = words.filter(word => 
        !keywords.includes(word) && word.length > 3
      );
      keywords = keywords.concat(remainingWords);
    }

    return keywords.slice(0, 3);
  }

  async function processUserInput(input) {
    log('Procesando input:', input);
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
        { text: translations[currentLanguage].technician, action: () => window.setRole('technician') },
        { text: translations[currentLanguage].engineer, action: () => window.setRole('engineer') }
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

    addMessage('user', input);
    chatInput.value = '';
    updateSendButtonState();
    adjustTextareaHeight();

    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'spinner-container';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = `<img src="./assets/Images/spinner.svg" alt="Cargando" class="spinner-img">`;
    spinnerContainer.appendChild(spinner);
    chatBody.appendChild(spinnerContainer);
    chatBody.scrollTop = chatBody.scrollHeight;

    const keywords = extractKeywords(input);
    log('Keywords extraídas:', keywords);
    if (keywords.length < 2 && !input.toLowerCase().match(/^(si|sí|no)$/i)) {
      spinnerContainer.remove();
      showTypingAndRespond(translations[currentLanguage].describeMore);
      return;
    }

    const query = keywords.map(encodeURIComponent).join(',');
    const adjustedRole = userRole === 'technician' ? 'tecnico' : 'ingeniero';
    const area = selectedArea.charAt(0).toUpperCase() + selectedArea.slice(1);
    const url = `https://backendchatbot-ylq2.onrender.com/api/solucion/buscar?q=${query}&rol=${encodeURIComponent(adjustedRole)}&area=${encodeURIComponent(area)}`;
    console.log('Solicitud enviada a:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        spinnerContainer.remove();
        if (response.status === 404 && errorData.mensaje === "No se encontraron coincidencias de palabras clave en el área '" + area.toLowerCase() + "'.") {
          showTypingAndRespond(`Parece que no hay información disponible de ${area} con esta consulta. Intenta de nuevo con palabras técnicas específicas, como "${commonKeywordsByArea[selectedArea.toLowerCase()]?.slice(0, 3).join('", "') || 'términos técnicos'}".`);
        } else {
          throw new Error(`Error ${response.status}: ${errorData.mensaje || 'Solicitud inválida'}`);
        }
        return;
      }

      const data = await response.json();
      let message;
      if (data.soluciones && data.soluciones.length > 0) {
        const solution = data.soluciones[0];
        message = `
          <strong>Área:</strong> ${solution.area}<br>
          <strong>Descripción:</strong> ${solution.description}<br>
          <strong>Solución:</strong> 
        `;
        if (solution.solucion && solution.solucion.startsWith('http')) {
          message += `<a href="${solution.solucion}" target="_blank">Ver solución</a>`;
        } else {
          message += solution.solucion || translations[currentLanguage].problemNotRecognized;
        }
        spinnerContainer.remove();
        showTypingAndRespond(message);
        showTypingAndRespond('¿Fue útil esta solución?', [
          { text: translations[currentLanguage].yes, action: () => handleSolutionConfirmation(true) },
          { text: translations[currentLanguage].no, action: () => handleSolutionConfirmation(false) }
        ]);
      } else {
        message = translations[currentLanguage].problemNotRecognized;
        spinnerContainer.remove();
        showTypingAndRespond(message);
      }
    } catch (error) {
      console.error('Error al conectar con el backend', error.message);
      spinnerContainer.remove();
      showTypingAndRespond('Error al conectar con el servidor interno. Intenta de nuevo.');
    }
    updateSendButtonState();
  }

  function showTypingAndRespond(message, options = [], delay = 1500, callback = () => {}) {
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
      setTimeout(callback, delay);
    }, 1500);
  }

  function handleSolutionConfirmation(isSolved) {
    if (isSolved) {
      showTypingAndRespond(translations[currentLanguage].pleasureToHelp, [], 1000, () => {
        selectedArea = null;
        chatInput.value = '';
        updateSendButtonState();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].areaPrompt}</span>`;
        chatBody.appendChild(messageDiv);

        const selectDiv = document.createElement('div');
        selectDiv.className = 'custom-dropdown';

        const dropdownList = document.createElement('ul');
        dropdownList.className = 'dropdown-list';
        const areaIcons = {
          'talanquera': './assets/Images/talanquera.png',
          'cajero': './assets/Images/cajero.png',
          'datafono': './assets/Images/datafono.png',
          'mantenimiento': './assets/Images/mantenimiento.png',
          'TVM': './assets/Images/tvm.png',
          'Aeropuerto': './assets/Images/aeropuerto.png'
        };
        dropdownList.innerHTML = `
          <li class="dropdown-item" data-value="">Selecciona un área</li>
          ${validAreas.map(area => `
            <li class="dropdown-item" data-value="${area}">
              <img src="${areaIcons[area]}" alt="${area} icon" class="dropdown-icon">
              ${area.charAt(0).toUpperCase() + area.slice(1)}
            </li>
          `).join('')}
        `;

        const selectButton = document.createElement('button');
        selectButton.className = 'option-button';
        selectButton.textContent = 'Seleccionar';
        selectButton.addEventListener('click', () => {
          const selectedItem = dropdownList.querySelector('.dropdown-item.selected');
          if (selectedItem && selectedItem.dataset.value) {
            setArea(selectedItem.dataset.value);
            selectDiv.remove();
          }
        });

        dropdownList.querySelectorAll('.dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            dropdownList.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
          });
        });

        selectDiv.appendChild(dropdownList);
        selectDiv.appendChild(selectButton);
        chatBody.appendChild(selectDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
      });
    } else {
      showTypingAndRespond(translations[currentLanguage].describeMore);
    }
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
    log('Reiniciando conversación');
    userRole = null;
    selectedArea = null;
    conversationHistory = [];
    isChatInitialized = false;
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedArea');
    localStorage.removeItem('isChatInitialized');
    chatBody.innerHTML = '';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `<img src="./assets/Images/IncomelecRounded.svg" alt="Bot Avatar"><span>${translations[currentLanguage].welcome}</span>`;
    chatBody.appendChild(messageDiv);

    const roleOptions = document.createElement('div');
    roleOptions.id = 'roleOptions';
    roleOptions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 5px; margin-top: 0.5rem; text-align: left;">
        <button class="btn btn-secondary btn-sm" style="background-color: #6c757d; border-color: #6c757d;" onclick="window.setRole('technician')">Externo</button>
        <div class="dropdown">
          <button type="button" class="btn btn-primary btn-sm dropdown-toggle" style="background-color: #006f32; border-color: #00973a;" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
            Interno
          </button>
          <ul class="dropdown-menu" style="min-width: 180px; position: absolute; z-index: 1000;">
            <li>
              <div class="p-2">
                <form id="loginForm" action="javascript:void(0)">
                  <div class="mb-2">
                    <label for="exampleDropdownFormEmail2" class="form-label text-muted" style="font-size: 0.78rem;">Usuario (soporte o soporte@dominio.com)</label>
                    <input type="text" class="form-control form-control-sm" id="exampleDropdownFormEmail2" placeholder="soporte o soporte@dominio.com" style="font-size: 0.78rem;" required pattern="^(soporte|mantenimiento)$">
                  </div>
                  <div class="mb-2">
                    <label for="exampleDropdownFormPassword2" class="form-label text-muted" style="font-size: 0.78rem;">Contraseña</label>
                    <input type="password" class="form-control form-control-sm" id="exampleDropdownFormPassword2" placeholder="Contraseña" style="font-size: 0.78rem;" required>
                  </div>
                  <div class="mb-2">
                    <div class="form-check">
                      <input type="checkbox" class="form-check-input" id="rememberMe">
                      <label class="form-check-label" for="rememberMe" style="font-size: 0.75rem;">Recordarme</label>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" style="background-color: #006f32; border-color: #006f32;">Iniciar Sesión</button>
                </form>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;
    chatBody.appendChild(roleOptions);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      initializeLoginForm(loginForm);
    } else {
      logError('No se encontró el formulario de login después de reiniciar');
    }

    isChatInitialized = true;
    localStorage.setItem('isChatInitialized', 'true');
    chatBody.scrollTop = chatBody.scrollHeight;
    updateSendButtonState();
  }

  chatInput.value = '';
  updateSendButtonState();
});