export const mockAsset = JSON.stringify({
  "app": {
    "greeting": "Hi! I am {{name}}",
    "list": [
      "First test",
      "Second test"
    ]
  }
}, null, 2);

export const mockTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "Ciao! Sono {{name}}",
    "list": [
      "Prima prova",
      "Seconda prova"
    ]
  }
}, null, 2);

export const mockMetaTranslated = JSON.stringify([
  "app.greeting",
  "app.list.0",
  "app.list.1"
], null, 2);

export const mockMetaTranslatedLangs = JSON.stringify([
  "it-IT"
], null, 2);

export const mockResponse = {
  choices: [
    {
      message: {
        content: "[\"Ciao! Sono {{name}}\",\"Prima prova\",\"Seconda prova\"]"
      }
    }
  ],
  usage: {
    total_tokens: 1
  }
};

export const mockAddTranslationAsset = JSON.stringify({
  "app": {
    "greeting": "Hi! I am {{name}}",
    "list": [
      "First test",
      "Second test"
    ],
    "title": "<h1>Library to translate JSON using GPT</h1>"
  }
}, null, 2);

export const mockAddTranslationTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "Ciao! Sono {{name}}",
    "list": [
      "Prima prova",
      "Seconda prova"
    ],
    "title": "<h1>Libreria per tradurre JSON usando GPT</h1>"
  }
}, null, 2);

export const mockAddTranslationMetaTranslated = JSON.stringify([
  "app.greeting",
  "app.list.0",
  "app.list.1",
  "app.title"
], null, 2);

export const mockAddTranslationMetaTranslatedLangs = JSON.stringify([
  "it-IT"
], null, 2);

export const mockAddTranslationResponse = {
  choices: [
    {
      message: {
        content: "[\"<h1>Libreria per tradurre JSON usando GPT</h1>\"]"
      }
    }
  ],
  usage: {
    total_tokens: 1
  }
};

export const mockAddLangAsset = JSON.stringify({
  "app": {
    "greeting": "Hi! I am {{name}}",
    "list": [
      "First test",
      "Second test"
    ],
    "title": "<h1>Library to translate JSON using GPT</h1>"
  }
}, null, 2);

export const mockAddLangTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "¡Hola! Soy {{name}}",
    "list": [
      "Primera prueba",
      "Segunda prueba"
    ],
    "title": "<h1>Biblioteca para traducir JSON usando GPT</h1>"
  }
}, null, 2);

export const mockAddLangMetaTranslated = JSON.stringify([
  "app.greeting",
  "app.list.0",
  "app.list.1",
  "app.title"
], null, 2);

export const mockAddLangMetaTranslatedLangs = JSON.stringify([
  "it-IT",
  "es-ES"
], null, 2);

export const mockAddLangResponse = {
  choices: [
    {
      message: {
        content: "[\"¡Hola! Soy {{name}}\",\"Primera prueba\",\"Segunda prueba\",\"<h1>Biblioteca para traducir JSON usando GPT</h1>\"]"
      }
    }
  ],
  usage: {
    total_tokens: 1
  }
};
