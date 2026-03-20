import systemPrompt from '../assets/SystemPrompt.md?raw'
import { sessionManager } from './session-manager'

type GoogleLiveHandlers = {
  onInputTranscript?: (text: string)
    => void
  onOutputTranscript?: (text: string)
    => void
  onOpen?: () => void
  onClose?: (event: CloseEvent) =>
    void
  onError?: (event: Event) => void
  onMessage?: (data: unknown) => void
}

type GoogleLiveOptions = {
  model?: string
  systemInstruction?: string
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
  private handlers: GoogleLiveHandlers = {}
  private readonly model: string
  private readonly systemInstruction: string

  constructor(options: GoogleLiveOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL
    this.systemInstruction =
      options.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION
  }

  setHandlers(handlers: GoogleLiveHandlers) {
    this.handlers = handlers
  }

  async connect() {
    const current = this.ws

    if (
      current &&
      (current.readyState === WebSocket.CONNECTING ||
        current.readyState === WebSocket.OPEN)
    ) {
      return
    }

    // If an older socket is still finishing its close handshake, drop the ref
    // and create a fresh one.
    if (current && current.readyState === WebSocket.CLOSING) {
      this.ws = null
    }

    if (!this.apiKey) {
      const auth = await sessionManager.getAuth()
      this.apiKey = auth?.apiKey ?? ''
    }

    if (!this.apiKey) {
      throw new Error('GoogleLiveService requires an API key before connect().')
    }

    const url =
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`

    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      console.log('[GoogleLiveService] WebSocket opened')

      ws.send(
        JSON.stringify({
          setup: {
            model: this.model,
            generationConfig: {
              responseModalities: ['AUDIO'],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [{ text: this.systemInstruction }],
            },
          },
        }),
      )

      this.handlers.onOpen?.()
    }

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        return
      }

      if (typeof event.data !== 'string') {
        console.warn(
          '[GoogleLiveService] Unsupported WebSocket message type:',
          event.data,
        )
        return
      }

      console.log('[GoogleLiveService] Raw JSON message', event.data)

      let data: unknown

      try {
        data = JSON.parse(event.data) as GoogleLiveMessage
      } catch (error) {
        console.error(
          '[GoogleLiveService] Failed to parse WebSocket message:',
          error,
          event.data,
        )
        return
      }

      this.handlers.onMessage?.(data)

      const message = data as GoogleLiveMessage
      const inputText = message.serverContent?.inputTranscription?.text
      const outputText = message.serverContent?.outputTranscription?.text

      if (inputText) {
        console.log('[GoogleLiveService] Input transcript', inputText)
        this.handlers.onInputTranscript?.(inputText)
      }

      if (outputText) {
        console.log('[GoogleLiveService] Output transcript', outputText)
        this.handlers.onOutputTranscript?.(outputText)
      }
    }

    ws.onerror = (event) => {
      console.error('[GoogleLiveService] WebSocket error:', event)
      this.handlers.onError?.(event)
    }

    ws.onclose = (event) => {
      console.log('[GoogleLiveService] WebSocket closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      })

      // Only clear the ref if this close belongs to the current socket.
      if (this.ws === ws) {
        this.ws = null
      }

      this.handlers.onClose?.(event)
    }
  }

  sendAudioChunk(chunk: Uint8Array | ArrayBuffer) {
    const ws = this.ws

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
    const base64 = this.toBase64(bytes)

    ws.send(
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
    const ws = this.ws

    if (!ws) {
      return
    }

    if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
      return
    }

    if (ws.readyState === WebSocket.CONNECTING) {
      console.log('[GoogleLiveService] Closing WebSocket while connecting')
      ws.close()
      return
    }

    console.log('[GoogleLiveService] Closing WebSocket with normal closure')
    ws.close(1000, 'Client disconnect')
    this.handlers = {}
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
