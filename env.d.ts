declare namespace NodeJS {
  interface ProcessEnv {
    MAILERLITE_API_KEY: string
    MAILERLITE_GROUP_ID: string
    OPENAI_API_KEY?: string
    USE_LLM_SCHEDULER?: string
  }
}


