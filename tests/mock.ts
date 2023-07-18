export const mockAsset = JSON.stringify({
  "app": {
    "greeting": "Hi! I am {{name}}"
  }
}, null, 2);

export const mockTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "Ciao! Sono {{name}}"
  }
}, null, 2);

export const mockMetaTranslated = JSON.stringify([
  "app.greeting"
], null, 2);

export const mockMetaTranslatedLangs = JSON.stringify([
  "it-IT"
], null, 2);

export const mockResponse = {
  choices: [
    {
      message: {
        content: "[\"Ciao! Sono {{name}}\"]"
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
    "title": "<h1>Library to translate JSON using GPT</h1>"
  }
}, null, 2);

export const mockAddTranslationTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "Ciao! Sono {{name}}",
    "title": "<h1>Libreria per tradurre JSON usando GPT</h1>"
  }
}, null, 2);

export const mockAddTranslationMetaTranslated = JSON.stringify([
  "app.greeting",
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
    "title": "<h1>Library to translate JSON using GPT</h1>"
  }
}, null, 2);

export const mockAddLangTranslatedAsset = JSON.stringify({
  "app": {
    "greeting": "¡Hola! Soy {{name}}",
    "title": "<h1>Biblioteca para traducir JSON usando GPT</h1>"
  }
}, null, 2);

export const mockAddLangMetaTranslated = JSON.stringify([
  "app.greeting",
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
        content: "[\"¡Hola! Soy {{name}}\",\"<h1>Biblioteca para traducir JSON usando GPT</h1>\"]"
      }
    }
  ],
  usage: {
    total_tokens: 1
  }
};
