import systemPrompt from '../assets/SystemPrompt.md?raw'
import { sessionManager } from './session-manager'

type GoogleLiveOptions = {
  model?: string
  systemInstruction?: string
  onInputTranscript?: (text: string) => void
  onOutputTranscript?: (text: string) => void
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (data: unknown) => void
}

type GoogleLiveMessage = {
  serverContent?: {
    inputTranscription?: {
      text?: string
    }
    outputTranscription?: {
      text?: string
    }
  }
}

const DEFAULT_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025'
const DEFAULT_SYSTEM_INSTRUCTION = systemPrompt

export class GoogleLiveService {
  private ws: WebSocket | null = null
  private apiKey = ''
  private readonly model: string
  private readonly systemInstruction: string
  private readonly onInputTranscript?: (text: string) => void
  private readonly onOutputTranscript?: (text: string) => void
  private readonly onOpen?: () => void
  private readonly onClose?: (event: CloseEvent) => void
  private readonly onError?: (event: Event) => void
  private readonly onMessage?: (data: unknown) => void

  constructor(options: GoogleLiveOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL
    this.systemInstruction =
      options.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION
    this.onInputTranscript = options.onInputTranscript
    this.onOutputTranscript = options.onOutputTranscript
    this.onOpen = options.onOpen
    this.onClose = options.onClose
    this.onError = options.onError
    this.onMessage = options.onMessage
  }

  async connect() {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      return
    }

    // Load the persisted API key on first connect after startup or refresh.
    if (!this.apiKey) {
      const auth = await sessionManager.getAuth()
      this.apiKey = auth?.apiKey ?? ''
    }

    if (!this.apiKey) {
      throw new Error('GoogleLiveService requires an API key before connect().')
    }

    const url =
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          setup: {
            model: this.model,
            generationConfig: {
              responseModalities: ['TEXT'],
            },
            systemInstruction: {
              parts: [{ text: this.systemInstruction }],
            },
          },
        }),
      )

      this.onOpen?.()
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as GoogleLiveMessage

      this.onMessage?.(data)

      const inputText = data.serverContent?.inputTranscription?.text
      const outputText = data.serverContent?.outputTranscription?.text

      if (inputText) {
        this.onInputTranscript?.(inputText)
      }

      if (outputText) {
        this.onOutputTranscript?.(outputText)
      }
    }

    this.ws.onerror = (event) => {
      this.onError?.(event)
    }

    this.ws.onclose = (event) => {
      this.ws = null
      this.onClose?.(event)
    }
  }

  sendAudioChunk(chunk: Uint8Array | ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
    const base64 = this.toBase64(bytes)

    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64,
            },
          ],
        },
      }),
    )
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private toBase64(bytes: Uint8Array) {
    let binary = ''
    const chunkSize = 0x8000

    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
    }

    return btoa(binary)
  }
}

export const googleService = new GoogleLiveService()
