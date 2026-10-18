/** Hard limits shared by the client (input maxLength) and the API validation. */
export const LIMITS = {
  messageChars: 2000,
  messages: 60,
  intentionChars: 600,
  ttsChars: 2500,
} as const;
