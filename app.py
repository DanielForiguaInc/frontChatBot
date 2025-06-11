from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# Cargar la base de conocimiento
knowledge_base = [
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
        "area": "Talanquera",
        "priority": "alta",
        "description": "emite pitidos constantes",
        "keywords": ["pitidos", "constantes", "talanquera"],
        "solution_technician": "Apaga la talanquera y revisa si hay obstrucciones en el mecanismo.",
        "solution_engineer": "Inspecciona el sistema de alertas y recalibra el sensor."
    }
    # Añade los demás casos como en knowledge_base.js
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
        "machineSuggestion": "¿Es un problema con la Máquina de entrada?",
        "controlSuggestion": "¿Es un problema con el Control de acceso?",
        "talanqueraSuggestion": "¿Es un problema con la Talanquera?",
        "rolePrompt": "Por favor, selecciona tu rol: técnico o ingeniero.",
        "areaPrompt": "Por favor, selecciona el área del problema."  # ¡Añade esta línea!
    },
    "en": {
        "problemDetected": lambda area, priority, role, solution: f"Issue detected in {area} (Priority: {priority}). <br><strong>{'Practical Solution:' if role == 'technician' else 'Technical Solution:'}</strong> {solution} <br>Was the issue resolved?",
        "yes": "Yes",
        "no": "No",
        "problemSolved": "Great! Do you need help with anything else?",
        "moreDetails": "Please provide more details or contact support.",
        "problemNotRecognized": "I don’t recognize that issue in the selected area. Please try describing it differently.",
        "machineSuggestion": "Is it an issue with the Entry Machine?",
        "controlSuggestion": "Is it an issue with Access Control?",
        "talanqueraSuggestion": "Is it an issue with the Talanquera?",
        "rolePrompt": "Please select your role: technician or engineer.",
        "areaPrompt": "Please select the area of the issue."  # ¡Añade esta línea!
    }
}

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    user_role = data.get('userRole')
    selected_area = data.get('selectedArea')
    language = data.get('currentLanguage', 'es')

    if not user_role:
        return jsonify({"response": translations[language].get("rolePrompt", "Error: Role not defined. Please select technician or engineer.")})

    if not selected_area:
        # Sugerir áreas basadas en el mensaje
        lower_input = message.lower()
        suggestions = []
        if "máquina" in lower_input:
            suggestions.append({"text": translations[language]["machineSuggestion"], "action": "setArea:Máquina de entrada"})
        elif "control" in lower_input or "tarjeta" in lower_input:
            suggestions.append({"text": translations[language]["controlSuggestion"], "action": "setArea:Control de acceso"})
        elif "talanquera" in lower_input or "puerta" in lower_input:
            suggestions.append({"text": translations[language]["talanqueraSuggestion"], "action": "setArea:Talanquera"})
        
        if suggestions:
            return jsonify({"response": translations[language]["areaPrompt"], "options": suggestions})
        else:
            return jsonify({"response": translations[language]["problemNotRecognized"]})

    # Usar NLP para clasificar el mensaje cuando hay área seleccionada
    candidate_labels = [item["description"] for item in knowledge_base if item["area"] == selected_area]
    if candidate_labels:
        try:
            result = classifier(message, candidate_labels)
            best_match = result['labels'][0]
            for item in knowledge_base:
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
        knowledge_base.append(data['update_knowledge'])
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