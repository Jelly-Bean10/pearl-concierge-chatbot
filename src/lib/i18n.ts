import type { ErrorCode } from "./types";

// UI translations. Place names, addresses, tags and each venue's own description are never translated.

export type Lang = "en" | "es" | "fr" | "de" | "ja" | "ur";

export const LANGS: { code: Lang; label: string; name: string; rtl: boolean }[] = [
  { code: "en", label: "English", name: "English", rtl: false },
  { code: "es", label: "Español", name: "Spanish", rtl: false },
  { code: "fr", label: "Français", name: "French", rtl: false },
  { code: "de", label: "Deutsch", name: "German", rtl: false },
  { code: "ja", label: "日本語", name: "Japanese", rtl: false },
  { code: "ur", label: "اردو", name: "Urdu", rtl: true },
];

export function parseLang(value: unknown): Lang {
  return LANGS.some((l) => l.code === value) ? (value as Lang) : "en";
}

export type ServiceType = "spa" | "late_checkout" | "airport_transfer" | "restaurant_reservation" | "other";
export const SERVICE_TYPES: ServiceType[] = [
  "spa",
  "late_checkout",
  "airport_transfer",
  "restaurant_reservation",
  "other",
];

export type FieldError = "required" | "email" | "date" | "time" | "partySize" | "tooLong" | "service";

type CityFn = (city?: string) => string;

export interface Dict {
  concierge: string;
  newChat: string;
  city: string;
  language: string;
  welcomeLabel: string;
  welcomeTitle: CityFn;
  welcomeBody: string;
  starters: { emoji: string; label: string; hint: string; prompt: CityFn }[];
  placeholder: string;
  footer: string;
  messageLabel: string;
  send: string;
  searching: string;
  thinking: string;
  retry: string;
  viewOnPearl: string;
  website: string;
  map: string;
  requestThis: string;
  errors: Record<ErrorCode | "network", string>;
  sug: {
    cheaper: string;
    pricier: string;
    different: string;
    drinksAfter: string;
    eatLate: string;
    eatNearby: string;
    hidden: (city: string) => string;
    dinner: (city: string) => string;
    book: (city: string) => string;
    cafes: (city: string) => string;
    things: (city: string) => string;
  };
  categories: Record<string, string>;
  form: {
    opened: (placeName: string) => string;
    typeLabel: string;
    typeVenue: string;
    typeHotel: string;
    place: string;
    service: string;
    pickService: string;
    services: Record<ServiceType, string>;
    city: string;
    pickCity: string;
    date: string;
    time: string;
    partySize: string;
    name: string;
    email: string;
    notes: string;
    optional: string;
    submit: string;
    submitting: string;
    cancel: string;
    notice: string;
    fieldErrors: Record<FieldError, string>;
    submitFailed: string;
    doneTitle: string;
    doneBody: (what: string, id: number) => string;
    cancelled: string;
  };
}

const en: Dict = {
  concierge: "Concierge",
  newChat: "New chat",
  city: "City",
  language: "Language",
  welcomeLabel: "Hi, I'm Pearl",
  welcomeTitle: (c) => (c ? `Where are you headed in ${c}?` : "Where are you headed?"),
  welcomeBody:
    "Ask me for places hand-picked by Pearl Club's local curators. Every suggestion links to its Pearl Club guide. Pick a city above, or start with one of these.",
  starters: [
    {
      emoji: "💎",
      label: "Find hidden gems",
      hint: "Local favourites, off the tourist trail",
      prompt: (c) => `Find me some hidden gems${c ? ` in ${c}` : ""}`,
    },
    {
      emoji: "🎟️",
      label: "Book an experience",
      hint: "Tours, shows, classes and culture",
      prompt: (c) => `I want to book an experience${c ? ` in ${c}` : ""}`,
    },
    {
      emoji: "🍽️",
      label: "Dinner tonight",
      hint: "From neighbourhood spots to special nights",
      prompt: (c) => `Where should I have dinner tonight${c ? ` in ${c}` : ""}?`,
    },
    {
      emoji: "🛏️",
      label: "Where to stay",
      hint: "Hotels with character",
      prompt: (c) => `Where should I stay${c ? ` in ${c}` : ""}?`,
    },
  ],
  placeholder: "Ask Pearl for a place…",
  footer: "Only Pearl Club curated places",
  messageLabel: "Message Pearl",
  send: "Send message",
  searching: "Searching Pearl Club's guides…",
  thinking: "Thinking…",
  retry: "Try again",
  viewOnPearl: "View on Pearl Club",
  website: "Website",
  map: "Map",
  requestThis: "Request this",
  errors: {
    bad_request: "That message couldn't be sent. Please check it and try again.",
    rate_limited: "You're sending messages quickly. Please wait a minute and try again.",
    upstream_rate_limited: "Pearl is very busy right now. Please try again in a minute.",
    upstream_timeout: "Pearl took too long to answer. Please try again.",
    upstream_error: "Pearl couldn't reach its language model. Please try again.",
    internal: "Something went wrong on our side. Please try again.",
    network: "Couldn't reach Pearl. Check your connection and try again.",
  },
  sug: {
    cheaper: "Something cheaper",
    pricier: "Something more upscale",
    different: "Show me different options",
    drinksAfter: "Where should I go for drinks after?",
    eatLate: "Where can I eat late nearby?",
    eatNearby: "Somewhere good to eat nearby?",
    hidden: (c) => `Hidden gems in ${c}`,
    dinner: (c) => `Dinner tonight in ${c}`,
    book: (c) => `Book an experience in ${c}`,
    cafes: (c) => `Best cafes in ${c}`,
    things: (c) => `Things to do in ${c}`,
  },
  categories: {
    activities: "Activities",
    "arts-and-culture": "Arts & Culture",
    bakeries: "Bakeries",
    bars: "Bars",
    breakfast: "Breakfast",
    cafes: "Cafes",
    dinner: "Dinner",
    "health-and-wellness": "Health & Wellness",
    "kid-friendly": "Kid Friendly",
    "late-night-food": "Late Night Food",
    "live-entertainment": "Live Entertainment",
    lunch: "Lunch",
    markets: "Markets",
    neighborhoods: "Neighborhoods",
    nightlife: "Nightlife",
    "outdoor-drinks": "Outdoor Drinks",
    "parks-and-nature": "Parks & Nature",
    services: "Services",
    shopping: "Shopping",
    sightseeing: "Sightseeing",
    stays: "Stays",
    "weekend-trips": "Weekend Trips",
    workspaces: "Workspaces",
  },
  form: {
    opened: (n) =>
      n
        ? `Let's log a request for ${n}. Fill in the details below.`
        : "Let's log a hotel service request. Fill in the details below.",
    typeLabel: "Request type",
    typeVenue: "Venue request",
    typeHotel: "Hotel service",
    place: "Place",
    service: "Service",
    pickService: "Choose a service",
    services: {
      spa: "Spa",
      late_checkout: "Late checkout",
      airport_transfer: "Airport transfer",
      restaurant_reservation: "Restaurant reservation",
      other: "Other",
    },
    city: "City",
    pickCity: "Choose a city",
    date: "Date",
    time: "Time",
    partySize: "Party size",
    name: "Your name",
    email: "Email",
    notes: "Notes",
    optional: "optional",
    submit: "Send request",
    submitting: "Sending…",
    cancel: "Cancel",
    notice: "This logs a request. It is not a confirmed booking or reservation.",
    fieldErrors: {
      required: "Required",
      email: "Enter a valid email",
      date: "Choose a date from today onward",
      time: "Enter a valid time",
      partySize: "Enter a number from 1 to 20",
      tooLong: "Too long",
      service: "Choose a service",
    },
    submitFailed: "Couldn't log your request. Please try again.",
    doneTitle: "Request logged. Not confirmed.",
    doneBody: (what, id) =>
      `Your request for ${what} is logged (ref #${id}). It would be passed to the venue or hotel desk, but this is not a confirmed reservation. Nothing is booked until they confirm with you directly.`,
    cancelled: "Request cancelled.",
  },
};

const es: Dict = {
  concierge: "Conserjería",
  newChat: "Nuevo chat",
  city: "Ciudad",
  language: "Idioma",
  welcomeLabel: "Hola, soy Pearl",
  welcomeTitle: (c) => (c ? `¿A dónde vas en ${c}?` : "¿A dónde vas?"),
  welcomeBody:
    "Pídeme lugares elegidos por los curadores locales de Pearl Club. Cada sugerencia enlaza con su guía en Pearl Club. Elige una ciudad arriba o empieza con una de estas opciones.",
  starters: [
    {
      emoji: "💎",
      label: "Descubrir joyas ocultas",
      hint: "Favoritos locales, lejos de las rutas turísticas",
      prompt: (c) => `Encuéntrame algunas joyas ocultas${c ? ` en ${c}` : ""}`,
    },
    {
      emoji: "🎟️",
      label: "Reservar una experiencia",
      hint: "Tours, espectáculos, clases y cultura",
      prompt: (c) => `Quiero reservar una experiencia${c ? ` en ${c}` : ""}`,
    },
    {
      emoji: "🍽️",
      label: "Cena de esta noche",
      hint: "De locales de barrio a noches especiales",
      prompt: (c) => `¿Dónde puedo cenar esta noche${c ? ` en ${c}` : ""}?`,
    },
    {
      emoji: "🛏️",
      label: "Dónde alojarse",
      hint: "Hoteles con carácter",
      prompt: (c) => `¿Dónde me alojo${c ? ` en ${c}` : ""}?`,
    },
  ],
  placeholder: "Pídele a Pearl un lugar…",
  footer: "Solo lugares curados por Pearl Club",
  messageLabel: "Mensaje para Pearl",
  send: "Enviar mensaje",
  searching: "Buscando en las guías de Pearl Club…",
  thinking: "Pensando…",
  retry: "Reintentar",
  viewOnPearl: "Ver en Pearl Club",
  website: "Sitio web",
  map: "Mapa",
  requestThis: "Solicitar esto",
  errors: {
    bad_request: "No se pudo enviar ese mensaje. Revísalo e inténtalo de nuevo.",
    rate_limited: "Estás enviando mensajes muy rápido. Espera un minuto e inténtalo de nuevo.",
    upstream_rate_limited: "Pearl está muy ocupada ahora mismo. Inténtalo de nuevo en un minuto.",
    upstream_timeout: "Pearl tardó demasiado en responder. Inténtalo de nuevo.",
    upstream_error: "Pearl no pudo conectar con su modelo de lenguaje. Inténtalo de nuevo.",
    internal: "Algo salió mal por nuestra parte. Inténtalo de nuevo.",
    network: "No se pudo conectar con Pearl. Revisa tu conexión e inténtalo de nuevo.",
  },
  sug: {
    cheaper: "Algo más barato",
    pricier: "Algo más elegante",
    different: "Muéstrame otras opciones",
    drinksAfter: "¿Dónde tomar algo después?",
    eatLate: "¿Dónde puedo comer tarde cerca?",
    eatNearby: "¿Algún buen sitio para comer cerca?",
    hidden: (c) => `Joyas ocultas en ${c}`,
    dinner: (c) => `Cena esta noche en ${c}`,
    book: (c) => `Reservar una experiencia en ${c}`,
    cafes: (c) => `Mejores cafés en ${c}`,
    things: (c) => `Qué hacer en ${c}`,
  },
  categories: {
    activities: "Actividades",
    "arts-and-culture": "Arte y cultura",
    bakeries: "Panaderías",
    bars: "Bares",
    breakfast: "Desayuno",
    cafes: "Cafés",
    dinner: "Cena",
    "health-and-wellness": "Salud y bienestar",
    "kid-friendly": "Para niños",
    "late-night-food": "Comida nocturna",
    "live-entertainment": "Espectáculos en vivo",
    lunch: "Almuerzo",
    markets: "Mercados",
    neighborhoods: "Barrios",
    nightlife: "Vida nocturna",
    "outdoor-drinks": "Copas al aire libre",
    "parks-and-nature": "Parques y naturaleza",
    services: "Servicios",
    shopping: "Compras",
    sightseeing: "Turismo",
    stays: "Alojamiento",
    "weekend-trips": "Escapadas",
    workspaces: "Espacios de trabajo",
  },
  form: {
    opened: (n) =>
      n
        ? `Vamos a registrar una solicitud para ${n}. Completa los datos a continuación.`
        : "Vamos a registrar una solicitud de servicio de hotel. Completa los datos a continuación.",
    typeLabel: "Tipo de solicitud",
    typeVenue: "Solicitud a un lugar",
    typeHotel: "Servicio de hotel",
    place: "Lugar",
    service: "Servicio",
    pickService: "Elige un servicio",
    services: {
      spa: "Spa",
      late_checkout: "Salida tardía",
      airport_transfer: "Traslado al aeropuerto",
      restaurant_reservation: "Reserva de restaurante",
      other: "Otro",
    },
    city: "Ciudad",
    pickCity: "Elige una ciudad",
    date: "Fecha",
    time: "Hora",
    partySize: "Número de personas",
    name: "Tu nombre",
    email: "Correo electrónico",
    notes: "Notas",
    optional: "opcional",
    submit: "Enviar solicitud",
    submitting: "Enviando…",
    cancel: "Cancelar",
    notice: "Esto registra una solicitud. No es una reserva confirmada.",
    fieldErrors: {
      required: "Obligatorio",
      email: "Introduce un correo válido",
      date: "Elige una fecha a partir de hoy",
      time: "Introduce una hora válida",
      partySize: "Introduce un número del 1 al 20",
      tooLong: "Demasiado largo",
      service: "Elige un servicio",
    },
    submitFailed: "No se pudo registrar tu solicitud. Inténtalo de nuevo.",
    doneTitle: "Solicitud registrada. No confirmada.",
    doneBody: (what, id) =>
      `Tu solicitud de ${what} está registrada (ref. #${id}). Se pasaría al lugar o a la recepción del hotel, pero no es una reserva confirmada. No hay nada reservado hasta que ellos te lo confirmen directamente.`,
    cancelled: "Solicitud cancelada.",
  },
};

const fr: Dict = {
  concierge: "Conciergerie",
  newChat: "Nouvelle discussion",
  city: "Ville",
  language: "Langue",
  welcomeLabel: "Bonjour, je suis Pearl",
  welcomeTitle: (c) => (c ? `Où allez-vous à ${c} ?` : "Où allez-vous ?"),
  welcomeBody:
    "Demandez-moi des adresses choisies par les curateurs locaux de Pearl Club. Chaque suggestion renvoie vers son guide Pearl Club. Choisissez une ville ci-dessus ou commencez par l'une de ces idées.",
  starters: [
    {
      emoji: "💎",
      label: "Trouver des pépites",
      hint: "Favoris locaux, hors des sentiers touristiques",
      prompt: (c) => `Trouve-moi des pépites${c ? ` à ${c}` : ""}`,
    },
    {
      emoji: "🎟️",
      label: "Réserver une expérience",
      hint: "Visites, spectacles, cours et culture",
      prompt: (c) => `Je veux réserver une expérience${c ? ` à ${c}` : ""}`,
    },
    {
      emoji: "🍽️",
      label: "Dîner ce soir",
      hint: "Des adresses de quartier aux soirées spéciales",
      prompt: (c) => `Où dîner ce soir${c ? ` à ${c}` : ""} ?`,
    },
    {
      emoji: "🛏️",
      label: "Où dormir",
      hint: "Des hôtels de caractère",
      prompt: (c) => `Où dormir${c ? ` à ${c}` : ""} ?`,
    },
  ],
  placeholder: "Demandez une adresse à Pearl…",
  footer: "Uniquement des lieux sélectionnés par Pearl Club",
  messageLabel: "Message pour Pearl",
  send: "Envoyer le message",
  searching: "Recherche dans les guides de Pearl Club…",
  thinking: "Réflexion…",
  retry: "Réessayer",
  viewOnPearl: "Voir sur Pearl Club",
  website: "Site web",
  map: "Carte",
  requestThis: "Faire une demande",
  errors: {
    bad_request: "Ce message n'a pas pu être envoyé. Vérifiez-le et réessayez.",
    rate_limited: "Vous envoyez des messages trop vite. Attendez une minute et réessayez.",
    upstream_rate_limited: "Pearl est très sollicitée en ce moment. Réessayez dans une minute.",
    upstream_timeout: "Pearl a mis trop de temps à répondre. Réessayez.",
    upstream_error: "Pearl n'a pas pu joindre son modèle de langage. Réessayez.",
    internal: "Un problème est survenu de notre côté. Réessayez.",
    network: "Impossible de joindre Pearl. Vérifiez votre connexion et réessayez.",
  },
  sug: {
    cheaper: "Moins cher",
    pricier: "Plus haut de gamme",
    different: "Montre-moi d'autres options",
    drinksAfter: "Où aller boire un verre ensuite ?",
    eatLate: "Où manger tard à proximité ?",
    eatNearby: "Une bonne adresse pour manger à proximité ?",
    hidden: (c) => `Pépites à ${c}`,
    dinner: (c) => `Dîner ce soir à ${c}`,
    book: (c) => `Réserver une expérience à ${c}`,
    cafes: (c) => `Meilleurs cafés à ${c}`,
    things: (c) => `Que faire à ${c}`,
  },
  categories: {
    activities: "Activités",
    "arts-and-culture": "Arts et culture",
    bakeries: "Boulangeries",
    bars: "Bars",
    breakfast: "Petit-déjeuner",
    cafes: "Cafés",
    dinner: "Dîner",
    "health-and-wellness": "Santé et bien-être",
    "kid-friendly": "Avec des enfants",
    "late-night-food": "Restauration tardive",
    "live-entertainment": "Spectacles vivants",
    lunch: "Déjeuner",
    markets: "Marchés",
    neighborhoods: "Quartiers",
    nightlife: "Vie nocturne",
    "outdoor-drinks": "Verres en terrasse",
    "parks-and-nature": "Parcs et nature",
    services: "Services",
    shopping: "Shopping",
    sightseeing: "Visites",
    stays: "Hébergement",
    "weekend-trips": "Escapades",
    workspaces: "Espaces de travail",
  },
  form: {
    opened: (n) =>
      n
        ? `Enregistrons une demande pour ${n}. Remplissez les informations ci-dessous.`
        : "Enregistrons une demande de service hôtelier. Remplissez les informations ci-dessous.",
    typeLabel: "Type de demande",
    typeVenue: "Demande à un lieu",
    typeHotel: "Service d'hôtel",
    place: "Lieu",
    service: "Service",
    pickService: "Choisissez un service",
    services: {
      spa: "Spa",
      late_checkout: "Départ tardif",
      airport_transfer: "Transfert aéroport",
      restaurant_reservation: "Réservation de restaurant",
      other: "Autre",
    },
    city: "Ville",
    pickCity: "Choisissez une ville",
    date: "Date",
    time: "Heure",
    partySize: "Nombre de personnes",
    name: "Votre nom",
    email: "E-mail",
    notes: "Notes",
    optional: "facultatif",
    submit: "Envoyer la demande",
    submitting: "Envoi…",
    cancel: "Annuler",
    notice: "Cela enregistre une demande. Ce n'est pas une réservation confirmée.",
    fieldErrors: {
      required: "Obligatoire",
      email: "Saisissez un e-mail valide",
      date: "Choisissez une date à partir d'aujourd'hui",
      time: "Saisissez une heure valide",
      partySize: "Saisissez un nombre de 1 à 20",
      tooLong: "Trop long",
      service: "Choisissez un service",
    },
    submitFailed: "Impossible d'enregistrer votre demande. Réessayez.",
    doneTitle: "Demande enregistrée. Non confirmée.",
    doneBody: (what, id) =>
      `Votre demande pour ${what} est enregistrée (réf. n° ${id}). Elle serait transmise au lieu ou à la réception de l'hôtel, mais ce n'est pas une réservation confirmée. Rien n'est réservé tant qu'ils ne vous ont pas confirmé directement.`,
    cancelled: "Demande annulée.",
  },
};

const de: Dict = {
  concierge: "Concierge",
  newChat: "Neuer Chat",
  city: "Stadt",
  language: "Sprache",
  welcomeLabel: "Hallo, ich bin Pearl",
  welcomeTitle: (c) => (c ? `Wohin geht es in ${c}?` : "Wohin soll es gehen?"),
  welcomeBody:
    "Frag mich nach Orten, die von den lokalen Kuratoren von Pearl Club ausgewählt wurden. Jeder Vorschlag verlinkt auf seinen Pearl-Club-Guide. Wähle oben eine Stadt oder starte mit einer dieser Ideen.",
  starters: [
    {
      emoji: "💎",
      label: "Geheimtipps finden",
      hint: "Lokale Favoriten abseits der Touristenpfade",
      prompt: (c) => `Finde mir ein paar Geheimtipps${c ? ` in ${c}` : ""}`,
    },
    {
      emoji: "🎟️",
      label: "Erlebnis buchen",
      hint: "Touren, Shows, Kurse und Kultur",
      prompt: (c) => `Ich möchte ein Erlebnis buchen${c ? ` in ${c}` : ""}`,
    },
    {
      emoji: "🍽️",
      label: "Abendessen heute",
      hint: "Vom Kiez-Lokal bis zum besonderen Abend",
      prompt: (c) => `Wo kann ich heute Abend essen${c ? ` in ${c}` : ""}?`,
    },
    {
      emoji: "🛏️",
      label: "Wo übernachten",
      hint: "Hotels mit Charakter",
      prompt: (c) => `Wo soll ich übernachten${c ? ` in ${c}` : ""}?`,
    },
  ],
  placeholder: "Frag Pearl nach einem Ort…",
  footer: "Nur von Pearl Club kuratierte Orte",
  messageLabel: "Nachricht an Pearl",
  send: "Nachricht senden",
  searching: "Durchsuche die Pearl-Club-Guides…",
  thinking: "Denke nach…",
  retry: "Erneut versuchen",
  viewOnPearl: "Auf Pearl Club ansehen",
  website: "Website",
  map: "Karte",
  requestThis: "Anfrage senden",
  errors: {
    bad_request: "Diese Nachricht konnte nicht gesendet werden. Bitte prüfe sie und versuche es erneut.",
    rate_limited: "Du sendest Nachrichten sehr schnell. Bitte warte eine Minute und versuche es erneut.",
    upstream_rate_limited: "Pearl ist gerade sehr gefragt. Bitte versuche es in einer Minute erneut.",
    upstream_timeout: "Pearl hat zu lange für die Antwort gebraucht. Bitte versuche es erneut.",
    upstream_error: "Pearl konnte ihr Sprachmodell nicht erreichen. Bitte versuche es erneut.",
    internal: "Auf unserer Seite ist etwas schiefgelaufen. Bitte versuche es erneut.",
    network: "Pearl ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.",
  },
  sug: {
    cheaper: "Etwas Günstigeres",
    pricier: "Etwas Gehobeneres",
    different: "Zeig mir andere Optionen",
    drinksAfter: "Wo kann ich danach etwas trinken?",
    eatLate: "Wo kann ich in der Nähe spät essen?",
    eatNearby: "Ein guter Ort zum Essen in der Nähe?",
    hidden: (c) => `Geheimtipps in ${c}`,
    dinner: (c) => `Abendessen heute in ${c}`,
    book: (c) => `Erlebnis buchen in ${c}`,
    cafes: (c) => `Beste Cafés in ${c}`,
    things: (c) => `Was man in ${c} unternehmen kann`,
  },
  categories: {
    activities: "Aktivitäten",
    "arts-and-culture": "Kunst & Kultur",
    bakeries: "Bäckereien",
    bars: "Bars",
    breakfast: "Frühstück",
    cafes: "Cafés",
    dinner: "Abendessen",
    "health-and-wellness": "Gesundheit & Wellness",
    "kid-friendly": "Kinderfreundlich",
    "late-night-food": "Essen spät nachts",
    "live-entertainment": "Live-Unterhaltung",
    lunch: "Mittagessen",
    markets: "Märkte",
    neighborhoods: "Viertel",
    nightlife: "Nachtleben",
    "outdoor-drinks": "Drinks im Freien",
    "parks-and-nature": "Parks & Natur",
    services: "Services",
    shopping: "Shopping",
    sightseeing: "Sehenswürdigkeiten",
    stays: "Unterkünfte",
    "weekend-trips": "Wochenendtrips",
    workspaces: "Arbeitsplätze",
  },
  form: {
    opened: (n) =>
      n
        ? `Wir erfassen eine Anfrage für ${n}. Fülle die Angaben unten aus.`
        : "Wir erfassen eine Hotelservice-Anfrage. Fülle die Angaben unten aus.",
    typeLabel: "Art der Anfrage",
    typeVenue: "Anfrage an einen Ort",
    typeHotel: "Hotelservice",
    place: "Ort",
    service: "Service",
    pickService: "Service wählen",
    services: {
      spa: "Spa",
      late_checkout: "Später Check-out",
      airport_transfer: "Flughafentransfer",
      restaurant_reservation: "Restaurantreservierung",
      other: "Sonstiges",
    },
    city: "Stadt",
    pickCity: "Stadt wählen",
    date: "Datum",
    time: "Uhrzeit",
    partySize: "Personenzahl",
    name: "Dein Name",
    email: "E-Mail",
    notes: "Anmerkungen",
    optional: "optional",
    submit: "Anfrage senden",
    submitting: "Wird gesendet…",
    cancel: "Abbrechen",
    notice: "Dies erfasst eine Anfrage. Es ist keine bestätigte Buchung oder Reservierung.",
    fieldErrors: {
      required: "Pflichtfeld",
      email: "Gültige E-Mail eingeben",
      date: "Datum ab heute wählen",
      time: "Gültige Uhrzeit eingeben",
      partySize: "Zahl von 1 bis 20 eingeben",
      tooLong: "Zu lang",
      service: "Service wählen",
    },
    submitFailed: "Deine Anfrage konnte nicht erfasst werden. Bitte versuche es erneut.",
    doneTitle: "Anfrage erfasst. Nicht bestätigt.",
    doneBody: (what, id) =>
      `Deine Anfrage für ${what} ist erfasst (Ref. #${id}). Sie würde an den Ort oder die Hotelrezeption weitergeleitet, ist aber keine bestätigte Reservierung. Gebucht ist erst etwas, wenn sie es dir direkt bestätigen.`,
    cancelled: "Anfrage abgebrochen.",
  },
};

const ja: Dict = {
  concierge: "コンシェルジュ",
  newChat: "新しいチャット",
  city: "都市",
  language: "言語",
  welcomeLabel: "こんにちは、Pearlです",
  welcomeTitle: (c) => (c ? `${c}でどこへ行きますか？` : "どこへ行きますか？"),
  welcomeBody:
    "Pearl Clubの地元キュレーターが選んだ場所をご紹介します。すべての提案にはPearl Clubのガイドへのリンクがあります。上で都市を選ぶか、次のどれかから始めてください。",
  starters: [
    {
      emoji: "💎",
      label: "穴場を探す",
      hint: "観光客の少ない地元のお気に入り",
      prompt: (c) => `${c ? `${c}の` : ""}穴場を教えて`,
    },
    {
      emoji: "🎟️",
      label: "体験を予約する",
      hint: "ツアー、ショー、レッスン、カルチャー",
      prompt: (c) => `${c ? `${c}で` : ""}体験を予約したい`,
    },
    {
      emoji: "🍽️",
      label: "今夜のディナー",
      hint: "近所の名店から特別な夜まで",
      prompt: (c) => `今夜${c ? `${c}で` : ""}ディナーに行くならどこがいい？`,
    },
    {
      emoji: "🛏️",
      label: "おすすめの宿泊先",
      hint: "個性のあるホテル",
      prompt: (c) => `${c ? `${c}で` : ""}どこに泊まるのがいい？`,
    },
  ],
  placeholder: "Pearlに場所を聞いてみましょう…",
  footer: "Pearl Clubがキュレーションした場所のみ",
  messageLabel: "Pearlへのメッセージ",
  send: "メッセージを送信",
  searching: "Pearl Clubのガイドを検索中…",
  thinking: "考え中…",
  retry: "再試行",
  viewOnPearl: "Pearl Clubで見る",
  website: "ウェブサイト",
  map: "地図",
  requestThis: "リクエストする",
  errors: {
    bad_request: "メッセージを送信できませんでした。内容を確認してもう一度お試しください。",
    rate_limited: "メッセージの送信が早すぎます。1分ほど待ってからもう一度お試しください。",
    upstream_rate_limited: "Pearlは現在とても混み合っています。1分後にもう一度お試しください。",
    upstream_timeout: "Pearlの応答に時間がかかりすぎました。もう一度お試しください。",
    upstream_error: "Pearlが言語モデルに接続できませんでした。もう一度お試しください。",
    internal: "こちら側で問題が発生しました。もう一度お試しください。",
    network: "Pearlに接続できませんでした。接続を確認してもう一度お試しください。",
  },
  sug: {
    cheaper: "もっと安いところ",
    pricier: "もっと上質なところ",
    different: "他の候補を見せて",
    drinksAfter: "その後に飲める場所は？",
    eatLate: "近くで遅くまで食べられる場所は？",
    eatNearby: "近くでおいしい食事ができる場所は？",
    hidden: (c) => `${c}の穴場`,
    dinner: (c) => `${c}で今夜のディナー`,
    book: (c) => `${c}で体験を予約`,
    cafes: (c) => `${c}のおすすめカフェ`,
    things: (c) => `${c}でできること`,
  },
  categories: {
    activities: "アクティビティ",
    "arts-and-culture": "アート＆カルチャー",
    bakeries: "ベーカリー",
    bars: "バー",
    breakfast: "朝食",
    cafes: "カフェ",
    dinner: "ディナー",
    "health-and-wellness": "健康＆ウェルネス",
    "kid-friendly": "子連れ向け",
    "late-night-food": "深夜の食事",
    "live-entertainment": "ライブエンターテインメント",
    lunch: "ランチ",
    markets: "マーケット",
    neighborhoods: "エリア",
    nightlife: "ナイトライフ",
    "outdoor-drinks": "屋外ドリンク",
    "parks-and-nature": "公園＆自然",
    services: "サービス",
    shopping: "ショッピング",
    sightseeing: "観光",
    stays: "宿泊",
    "weekend-trips": "週末旅行",
    workspaces: "ワークスペース",
  },
  form: {
    opened: (n) =>
      n
        ? `${n}へのリクエストを記録しましょう。以下に詳細を入力してください。`
        : "ホテルサービスのリクエストを記録しましょう。以下に詳細を入力してください。",
    typeLabel: "リクエストの種類",
    typeVenue: "お店・施設へのリクエスト",
    typeHotel: "ホテルサービス",
    place: "場所",
    service: "サービス",
    pickService: "サービスを選択",
    services: {
      spa: "スパ",
      late_checkout: "レイトチェックアウト",
      airport_transfer: "空港送迎",
      restaurant_reservation: "レストラン予約",
      other: "その他",
    },
    city: "都市",
    pickCity: "都市を選択",
    date: "日付",
    time: "時間",
    partySize: "人数",
    name: "お名前",
    email: "メールアドレス",
    notes: "備考",
    optional: "任意",
    submit: "リクエストを送信",
    submitting: "送信中…",
    cancel: "キャンセル",
    notice: "これはリクエストの記録です。予約の確定ではありません。",
    fieldErrors: {
      required: "必須です",
      email: "有効なメールアドレスを入力してください",
      date: "今日以降の日付を選択してください",
      time: "有効な時間を入力してください",
      partySize: "1〜20の数字を入力してください",
      tooLong: "長すぎます",
      service: "サービスを選択してください",
    },
    submitFailed: "リクエストを記録できませんでした。もう一度お試しください。",
    doneTitle: "リクエストを記録しました。予約は確定していません。",
    doneBody: (what, id) =>
      `${what}のリクエストを記録しました（参照番号 #${id}）。お店または ホテルのフロントに伝えられる想定ですが、予約の確定ではありません。先方から直接確認があるまで、何も予約されていません。`,
    cancelled: "リクエストをキャンセルしました。",
  },
};

const ur: Dict = {
  concierge: "کنسیرج",
  newChat: "نئی چیٹ",
  city: "شہر",
  language: "زبان",
  welcomeLabel: "السلام علیکم، میں پرل ہوں",
  welcomeTitle: (c) => (c ? `${c} میں آپ کہاں جا رہے ہیں؟` : "آپ کہاں جا رہے ہیں؟"),
  welcomeBody:
    "مجھ سے پرل کلب کے مقامی کیوریٹرز کی چنی ہوئی جگہوں کے بارے میں پوچھیں۔ ہر تجویز اپنی پرل کلب گائیڈ سے جڑی ہے۔ اوپر سے شہر چنیں، یا ان میں سے کسی سے شروع کریں۔",
  starters: [
    {
      emoji: "💎",
      label: "چھپے ہوئے ہیرے تلاش کریں",
      hint: "مقامی پسندیدہ جگہیں، سیاحوں کے راستے سے ہٹ کر",
      prompt: (c) => `مجھے${c ? ` ${c} میں` : ""} کچھ چھپی ہوئی بہترین جگہیں بتائیں`,
    },
    {
      emoji: "🎟️",
      label: "تجربہ بک کریں",
      hint: "ٹورز، شوز، کلاسز اور ثقافت",
      prompt: (c) => `میں${c ? ` ${c} میں` : ""} ایک تجربہ بک کرنا چاہتا ہوں`,
    },
    {
      emoji: "🍽️",
      label: "آج رات کا کھانا",
      hint: "محلے کی جگہوں سے خاص شاموں تک",
      prompt: (c) => `آج رات${c ? ` ${c} میں` : ""} کھانا کہاں کھاؤں؟`,
    },
    {
      emoji: "🛏️",
      label: "کہاں ٹھہریں",
      hint: "منفرد انداز کے ہوٹل",
      prompt: (c) => `مجھے${c ? ` ${c} میں` : ""} کہاں ٹھہرنا چاہیے؟`,
    },
  ],
  placeholder: "پرل سے کسی جگہ کے بارے میں پوچھیں…",
  footer: "صرف پرل کلب کی منتخب کردہ جگہیں",
  messageLabel: "پرل کو پیغام",
  send: "پیغام بھیجیں",
  searching: "پرل کلب کی گائیڈز میں تلاش جاری ہے…",
  thinking: "سوچ رہی ہوں…",
  retry: "دوبارہ کوشش کریں",
  viewOnPearl: "پرل کلب پر دیکھیں",
  website: "ویب سائٹ",
  map: "نقشہ",
  requestThis: "درخواست کریں",
  errors: {
    bad_request: "یہ پیغام نہیں بھیجا جا سکا۔ براہ کرم اسے چیک کر کے دوبارہ کوشش کریں۔",
    rate_limited: "آپ بہت تیزی سے پیغامات بھیج رہے ہیں۔ براہ کرم ایک منٹ رک کر دوبارہ کوشش کریں۔",
    upstream_rate_limited: "پرل اس وقت بہت مصروف ہے۔ براہ کرم ایک منٹ بعد دوبارہ کوشش کریں۔",
    upstream_timeout: "پرل کو جواب دینے میں بہت دیر لگی۔ براہ کرم دوبارہ کوشش کریں۔",
    upstream_error: "پرل اپنے لینگویج ماڈل تک نہیں پہنچ سکی۔ براہ کرم دوبارہ کوشش کریں۔",
    internal: "ہماری طرف کوئی خرابی ہو گئی۔ براہ کرم دوبارہ کوشش کریں۔",
    network: "پرل سے رابطہ نہیں ہو سکا۔ اپنا کنکشن چیک کر کے دوبارہ کوشش کریں۔",
  },
  sug: {
    cheaper: "کچھ سستا",
    pricier: "کچھ اعلیٰ درجے کا",
    different: "مجھے دوسری تجاویز دکھائیں",
    drinksAfter: "اس کے بعد مشروبات کے لیے کہاں جاؤں؟",
    eatLate: "قریب میں دیر تک کھانا کہاں ملے گا؟",
    eatNearby: "قریب میں کھانے کی کوئی اچھی جگہ؟",
    hidden: (c) => `${c} میں چھپی ہوئی بہترین جگہیں`,
    dinner: (c) => `${c} میں آج رات کا کھانا`,
    book: (c) => `${c} میں تجربہ بک کریں`,
    cafes: (c) => `${c} کے بہترین کیفے`,
    things: (c) => `${c} میں کرنے کے کام`,
  },
  categories: {
    activities: "سرگرمیاں",
    "arts-and-culture": "فن اور ثقافت",
    bakeries: "بیکریاں",
    bars: "بارز",
    breakfast: "ناشتہ",
    cafes: "کیفے",
    dinner: "رات کا کھانا",
    "health-and-wellness": "صحت اور تندرستی",
    "kid-friendly": "بچوں کے لیے موزوں",
    "late-night-food": "رات گئے کھانا",
    "live-entertainment": "لائیو تفریح",
    lunch: "دوپہر کا کھانا",
    markets: "بازار",
    neighborhoods: "محلے",
    nightlife: "نائٹ لائف",
    "outdoor-drinks": "کھلی فضا میں مشروبات",
    "parks-and-nature": "پارکس اور قدرت",
    services: "خدمات",
    shopping: "خریداری",
    sightseeing: "سیر و سیاحت",
    stays: "قیام",
    "weekend-trips": "ہفتے کے آخر کے سفر",
    workspaces: "ورک اسپیسز",
  },
  form: {
    opened: (n) =>
      n
        ? `آئیے ${n} کے لیے ایک درخواست درج کریں۔ نیچے تفصیلات بھریں۔`
        : "آئیے ہوٹل سروس کی ایک درخواست درج کریں۔ نیچے تفصیلات بھریں۔",
    typeLabel: "درخواست کی قسم",
    typeVenue: "مقام کے لیے درخواست",
    typeHotel: "ہوٹل سروس",
    place: "جگہ",
    service: "سروس",
    pickService: "سروس منتخب کریں",
    services: {
      spa: "اسپا",
      late_checkout: "دیر سے چیک آؤٹ",
      airport_transfer: "ایئرپورٹ ٹرانسفر",
      restaurant_reservation: "ریستوراں کی ریزرویشن",
      other: "دیگر",
    },
    city: "شہر",
    pickCity: "شہر منتخب کریں",
    date: "تاریخ",
    time: "وقت",
    partySize: "افراد کی تعداد",
    name: "آپ کا نام",
    email: "ای میل",
    notes: "نوٹس",
    optional: "اختیاری",
    submit: "درخواست بھیجیں",
    submitting: "بھیجا جا رہا ہے…",
    cancel: "منسوخ کریں",
    notice: "یہ ایک درخواست درج کرتا ہے۔ یہ تصدیق شدہ بکنگ یا ریزرویشن نہیں ہے۔",
    fieldErrors: {
      required: "ضروری ہے",
      email: "درست ای میل درج کریں",
      date: "آج یا اس کے بعد کی تاریخ منتخب کریں",
      time: "درست وقت درج کریں",
      partySize: "1 سے 20 کے درمیان عدد درج کریں",
      tooLong: "بہت لمبا ہے",
      service: "سروس منتخب کریں",
    },
    submitFailed: "آپ کی درخواست درج نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔",
    doneTitle: "درخواست درج ہو گئی۔ تصدیق شدہ نہیں۔",
    doneBody: (what, id) =>
      `${what} کے لیے آپ کی درخواست درج ہو گئی ہے (حوالہ نمبر #${id})۔ اسے مقام یا ہوٹل ڈیسک تک پہنچایا جائے گا، لیکن یہ تصدیق شدہ ریزرویشن نہیں ہے۔ جب تک وہ آپ سے براہ راست تصدیق نہ کریں، کچھ بھی بک نہیں ہے۔`,
    cancelled: "درخواست منسوخ کر دی گئی۔",
  },
};

export const DICTS: Record<Lang, Dict> = { en, es, fr, de, ja, ur };

export function t(lang: Lang): Dict {
  return DICTS[lang];
}
