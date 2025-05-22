const knowledgeBase = [
  {
    area: "Máquina de entrada",
    priority: "alta",
    description: "no lee el ticket",
    keywords: ["ticket", "lector", "no lee", "máquina"],
    solution_technician: "Limpia el lector con un paño seco y reinicia la máquina.",
    solution_engineer: "Verifica el log de errores en el panel de control y actualiza el firmware."
  },
  {
    area: "Cacharro",
    priority: "media",
    description: "no abre la puerta",
    keywords: ["cacharro", "puerta", "no abre", "batería"],
    solution_technician: "Comprueba la batería del cacharro y reemplázala si está baja.",
    solution_engineer: "Revisa la configuración de la señal en el sistema de control."
  },
  {
    area: "Control de acceso",
    priority: "baja",
    description: "tarjeta no reconocida",
    keywords: ["tarjeta", "no reconocida", "control", "lector"],
    solution_technician: "Limpia la tarjeta y prueba de nuevo. Asegúrate de que no esté dañada.",
    solution_engineer: "Verifica la base de datos de tarjetas en el sistema y reinicia el lector."
  },
  {
    area: "Máquina de entrada",
    priority: "media",
    description: "pantalla no enciende",
    keywords: ["pantalla", "no enciende", "máquina"],
    solution_technician: "Verifica la conexión de energía y reinicia la máquina.",
    solution_engineer: "Comprueba el suministro de energía y revisa el módulo de pantalla en el sistema."
  },
  {
    area: "Cacharro",
    priority: "alta",
    description: "emite pitidos constantes",
    keywords: ["pitidos", "constantes", "cacharro"],
    solution_technician: "Apaga el cacharro y revisa si hay obstrucciones en el mecanismo.",
    solution_engineer: "Inspecciona el sistema de alertas y recalibra el sensor."
  },
  {
  area: "Control de acceso",
  priority: "media",
  description: "puerta no responde al lector",
  keywords: ["puerta", "no responde", "lector", "control"],
  solution_technician: "Verifica la conexión del lector y reinicia el sistema.",
  solution_engineer: "Revisa los logs del sistema de control y actualiza el software."
},
{
  area: "Máquina de entrada",
  priority: "baja",
  description: "botones no responden",
  keywords: ["botones", "no responden", "máquina"],
  solution_technician: "Limpia los botones y prueba de nuevo.",
  solution_engineer: "Inspecciona el panel de control y reemplaza el módulo de botones si es necesario."
}
];