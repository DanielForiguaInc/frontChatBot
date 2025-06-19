from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
import json
from pathlib import Path

# Definición de la clase ChatHandler
class ChatHandler:
    def __init__(self, classifier, knowledge_base, translations):
        self.classifier = classifier
        self.knowledge_base = knowledge_base
        self.translations = translations

    def get_areas(self):
        return list(set([item['area'] for item in self.knowledge_base]))

    def process_message(self, message, user_role, selected_area, language='es'):
        if not user_role:
            return {
                "response": self.translations[language]["rolePrompt"],
                "options": [
                    {"text": self.translations[language]["technician"], "action": "setRole:technician"},
                    {"text": self.translations[language]["engineer"], "action": "setRole:engineer"}
                ]
            }

        if not selected_area:
            areas = self.get_areas()
            suggestions = []
            for area in areas:
                if any(keyword in message for item in self.knowledge_base if item['area'] == area for keyword in item['keywords']):
                    suggestions.append({"text": area, "action": f"setArea:{area}"})
            return {"response": self.translations[language]["areaPrompt"], "options": suggestions} if suggestions else {"response": self.translations[language]["problemNotRecognized"]}

        candidate_labels = [item["description"] for item in self.knowledge_base if item["area"] == selected_area]
        if candidate_labels:
            try:
                result = self.classifier(message, candidate_labels)
                best_match = result['labels'][0]
                for item in self.knowledge_base:
                    if item["area"] == selected_area and item["description"] == best_match:
                        prefix = self.translations[language][f"prefix_{user_role}"]
                        response = self.translations[language]["problemDetected"].format(
                            area=item["area"], priority=item["priority"], prefix=prefix, solution=item[f"solution_{user_role}"]
                        )
                        return {
                            "response": response,
                            "options": [
                                {"text": self.translations[language]["yes"], "action": "solved"},
                                {"text": self.translations[language]["no"], "action": "details"}
                            ]
                        }
            except Exception as e:
                return {"response": f"Error en el procesamiento de NLP: {str(e)}. Intenta de nuevo."}
        return {"response": self.translations[language]["problemNotRecognized"]}

    def update_knowledge(self, new_knowledge):
        self.knowledge_base.append(new_knowledge)
        return {"status": "updated"}

    def update_translation(self, language, key, value):
        if key and value:
            self.translations[language][key] = value
            return {"status": "translation_updated"}
        return {"status": "no changes"}

# --- CONFIGURACIÓN FLASK ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}})

# --- CARGAR DATOS DESDE ARCHIVOS ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'

with open(DATA_DIR / 'knowledge_base.json', 'r', encoding='utf-8') as f:
    knowledgeBase = json.load(f)

with open(DATA_DIR / 'translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

# --- INICIALIZAR NLP Y CHATBOT ---
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
chat_handler = ChatHandler(classifier, knowledgeBase, translations)

# --- RUTAS DE API ---
@app.route('/api/areas', methods=['GET'])
def get_areas():
    return jsonify({"areas": chat_handler.get_areas()})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    user_role = data.get('userRole')
    selected_area = data.get('selectedArea')
    language = data.get('currentLanguage', 'es')
    response = chat_handler.process_message(message, user_role, selected_area, language)
    return jsonify(response)

@app.route('/api/config', methods=['POST'])
def config():
    data = request.json
    if data.get('update_knowledge'):
        return jsonify(chat_handler.update_knowledge(data['update_knowledge']))
    elif data.get('update_translation'):
        language = data.get('language', 'es')
        key = data.get('key')
        value = data.get('value')
        return jsonify(chat_handler.update_translation(language, key, value))
    return jsonify({"status": "no changes"})

# --- ARRANQUE ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
