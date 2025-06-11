from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# Cargar la base de conocimiento
knowledgeBase = [
    {
        "area": "Máquina de entrada",
        "priority": "alta",
        "description": "no lee el ticket",
        "keywords": ["ticket", "lector", "no lee", "máquina"],
        "solution_technician": "Limpia el lector con un paño seco y reinicia la máquina.",
        "solution_engineer": "Verifica el log de errores en el panel de control y actualiza el firmware."
    },
    {
        "area": "Talanquera",
        "priority": "media",
        "description": "no abre la puerta",
        "keywords": ["talanquera", "puerta", "no abre", "batería"],
        "solution_technician": "Comprueba la batería de la talanquera y reemplázala si está baja.",
        "solution_engineer": "Revisa la configuración de la señal en el sistema de control."
    },
    {
        "area": "Control de acceso",
        "priority": "baja",
        "description": "tarjeta no reconocida",
        "keywords": ["tarjeta", "no reconocida", "control", "lector"],
        "solution_technician": "Limpia la tarjeta y prueba de nuevo. Asegúrate de que no esté dañada.",
        "solution_engineer": "Verifica la base de datos de tarjetas en el sistema y reinicia el lector."
    },
    {
        "area": "Máquina de entrada",
        "priority": "media",
        "description": "pantalla no enciende",
        "keywords": ["pantalla", "no enciende", "máquina"],
        "solution_technician": "Verifica la conexión de energía y reinicia la máquina.",
        "solution_engineer": "Comprueba el suministro de energía y revisa el módulo de pantalla en el sistema."
    },
    {
        "area": "Talanquera",
        "priority": "alta",
        "description": "emite pitidos constantes",
        "keywords": ["pitidos", "constantes", "talanquera"],
        "solution_technician": "Apaga la talanquera y revisa si hay obstrucciones en el mecanismo.",
        "solution_engineer": "Inspecciona el sistema de alertas y recalibra el sensor."
    },
    {
        "area": "Control de acceso",
        "priority": "media",
        "description": "puerta no responde al lector",
        "keywords": ["puerta", "no responde", "lector", "control"],
        "solution_technician": "Verifica la conexión del lector y reinicia el sistema.",
        "solution_engineer": "Revisa los logs del sistema de control y actualiza el software."
    },
    {
        "area": "Máquina de entrada",
        "priority": "baja",
        "description": "botones no responden",
        "keywords": ["botones", "no responden", "máquina"],
        "solution_technician": "Limpia los botones y prueba de nuevo.",
        "solution_engineer": "Inspecciona el panel de control y reemplaza el módulo de botones si es necesario."
    }
]

# Inicializar modelo NLP
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Traducciones
translations = {
    "es": {
        "problemDetected": lambda area, priority, role, solution: f"Problema detectado en {area} (Prioridad: {priority}). <br><strong>{'Solución práctica:' if role == 'technician' else 'Solución técnica:'}</strong> {solution} <br>¿Se resolvió el problema?",
        "yes": "Sí",
        "no": "No",
        "problemSolved": "¡Genial! ¿Necesitas ayuda con algo más?",
        "moreDetails": "Por favor, describe más detalles o contacta a soporte.",
        "problemNotRecognized": "No reconozco ese problema en el área seleccionada. Por favor, intenta describirlo de otra manera.",
        "rolePrompt": "Por favor, selecciona tu rol: técnico o ingeniero.",
        "areaPrompt": "Por favor, selecciona el área del problema.",
        "technician": "Técnico",
        "engineer": "Ingeniero"
    },
    "en": {
        "problemDetected": lambda area, priority, role, solution: f"Issue detected in {area} (Priority: {priority}). <br><strong>{'Practical Solution:' if role == 'technician' else 'Technical Solution:'}</strong> {solution} <br>Was the issue resolved?",
        "yes": "Yes",
        "no": "No",
        "problemSolved": "Great! Do you need help with anything else?",
        "moreDetails": "Please provide more details or contact support.",
        "problemNotRecognized": "I don’t recognize that issue in the selected area. Please try describing it differently.",
        "rolePrompt": "Please select your role: technician or engineer.",
        "areaPrompt": "Please select the area of the issue.",
        "technician": "Technician",
        "engineer": "Engineer"
    }
}

@app.route('/api/areas', methods=['GET'])
def get_areas():
    areas = list(set([item['area'] for item in knowledgeBase]))
    return jsonify({"areas": areas})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    user_role = data.get('userRole')
    selected_area = data.get('selectedArea')
    language = data.get('currentLanguage', 'es')

    # Si no hay rol seleccionado, pedirlo con opciones
    if not user_role:
        return jsonify({
            "response": translations[language]["rolePrompt"],
            "options": [
                {"text": translations[language]["technician"], "action": "setRole:technician"},
                {"text": translations[language]["engineer"], "action": "setRole:engineer"}
            ]
        })

    # Si no hay área seleccionada, sugerir áreas dinámicamente
    if not selected_area:
        areas = list(set([item['area'] for item in knowledgeBase]))
        suggestions = []
        for area in areas:
            if any(keyword in message for item in knowledgeBase if item['area'] == area for keyword in item['keywords']):
                suggestions.append({"text": area, "action": f"setArea:{area}"})
        
        if suggestions:
            return jsonify({
                "response": translations[language]["areaPrompt"],
                "options": suggestions
            })
        else:
            return jsonify({"response": translations[language]["problemNotRecognized"]})

    # Usar NLP para clasificar el mensaje cuando hay área seleccionada
    candidate_labels = [item["description"] for item in knowledgeBase if item["area"] == selected_area]
    if candidate_labels:
        try:
            result = classifier(message, candidate_labels)
            best_match = result['labels'][0]
            for item in knowledgeBase:
                if item["area"] == selected_area and item["description"] == best_match:
                    solution = item[f"solution_{user_role}"]
                    response = translations[language]["problemDetected"](item["area"], item["priority"], user_role, solution)
                    options = [
                        {"text": translations[language]["yes"], "action": "solved"},
                        {"text": translations[language]["no"], "action": "details"}
                    ]
                    return jsonify({"response": response, "options": options})
        except Exception as e:
            return jsonify({"response": f"Error en el procesamiento de NLP: {str(e)}. Intenta de nuevo."})

    return jsonify({"response": translations[language]["problemNotRecognized"]})

@app.route('/api/config', methods=['POST'])
def config():
    data = request.json
    if data.get('update_knowledge'):
        knowledgeBase.append(data['update_knowledge'])
        return jsonify({"status": "updated"})
    elif data.get('update_translation'):
        language = data.get('language', 'es')
        key = data.get('key')
        value = data.get('value')
        if key and value:
            translations[language][key] = value
            return jsonify({"status": "translation_updated"})
    return jsonify({"status": "no changes"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)