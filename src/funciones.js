import { OpenAI } from "langchain/llms/openai";
import {
  PromptTemplate, ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";

export const extraerExamenes = async (texto) => {
  const model = new OpenAI({
    openAIApiKey: "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",
    organization: "org-bqBKXJsYa0WWF6UFEVZghnKJ",
    modelName: "gpt-4",
    temperature: 0,
    maxTokens: 2214,
  });
  const template = "Genera una tabla con 5 columnas (exámen, unidad de medida, resultado, referencia, interpretacion (alto, bajo, normal, no informado)) del siguiente texto: {texto}";
  const prompt = new PromptTemplate({
    template: template,
    inputVariables: ["texto"],
  });
  const chain = new LLMChain({ llm: model, prompt: prompt });
  const res = await chain.call({ texto: texto });
  return res.text;
};

export const procesarElementosParalelo = (array) => {
  return Promise.all(array.map(extraerExamenes));
};

export const crearAnalisis = async (texto) => {
  const chat = new ChatOpenAI({
    openAIApiKey: "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",
    organization: "org-bqBKXJsYa0WWF6UFEVZghnKJ",
    modelName: "gpt-4",
    temperature: 1,
    maxTokens: 2000,
  });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un asistente virtual de interpretación de exámenes de laboratorio y tu objetivo es proporcionar una descripción concisa de los resultados anormales que están en la pagina de exámenes proporcionada, posibles diagnósticos y sugerencias de salud con un lenguaje amigable."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Página de exámenes: {examenes} "
    ),
  ]);
  const chainB = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });
  const resB = await chainB.call({ examenes: texto });
  return resB.text;
};

export const procesarAnalisisParalelo = (array) => {
  return Promise.all(array.map(crearAnalisis));
};

export const resumirAnalisis = async (texto) => {
  const model = new OpenAI({
    openAIApiKey: "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",
    organization: "org-bqBKXJsYa0WWF6UFEVZghnKJ",
    modelName: "gpt-4",
    temperature: 0,
    maxTokens: 2214,
  });
  const template = "Resume esta interpretación de exámenes médicos, creando una vision general del estado de salud del paciente, relacionando los resultados de todas las paginas, solo mencionando los exámenes alterados, y generando posibles diagnósticos para orientar al paciente, ademas mencionando otros exámenes para ayudar a llegar a un diagnóstico preciso. Interpretacion: {texto}";
  const prompt = new PromptTemplate({
    template: template,
    inputVariables: ["texto"],
  });
  const chain = new LLMChain({ llm: model, prompt: prompt });
  const res = await chain.call({ texto: texto });
  return res.text;
};

export const analisisImagen = async (texto) => {
  const chat = new ChatOpenAI({
    openAIApiKey: "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",
    organization: "org-bqBKXJsYa0WWF6UFEVZghnKJ",
    modelName: "gpt-4",
    temperature: 1,
    maxTokens: 2000,
  });
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "Eres un asistente virtual de interpretación de exámenes imagenológicos y tu objetivo es analizar el informe imagenológico, explícarselo al usuario sin conocimiento médico con palabras simples de forma clara para que no le queden dudas en un maximo de 300 palabras, concluyendo con los hallazgos mas importantes, indicando la gravedad de estos, nombrandole las posibles complicaciones en su organismo que los hallazgos generen y explicando conceptos, clasificaciones o palabras médicas que podria no entender."
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Informe imagenológico: {examenes} "
    ),
  ]);
  const chainB = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
  });
  const resB = await chainB.call({ examenes: texto });
  return resB.text;
};