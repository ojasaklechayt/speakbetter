import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  Modality,
  type FunctionCall,
  type LiveServerMessage,
  type Session,
} from '@google/genai'
import systemPrompt from '../assets/SystemPrompt.md?raw'
import { bytesToBase64 } from '../utils/base64'
import {
  extractTextFromServerContent,
  parseLiveSessionUpdate,
  STORE_LIVE_SESSION_UPDATE_TOOL,
  type LiveSessionUpdate,
} from '../utils/live-session'
import { sessionManager } from './session-manager'

type GoogleLiveHandlers = {
  onInputTranscript?: (text: string) => void
  onOutputTranscript?: (text: string) => void
  onLiveSessionUpdate?: (update: LiveSessionUpdate) => Promise<void> | void
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (data: unknown) => void
}

type GoogleLiveOptions = {
  model?: string
  systemInstruction?: string
}

const DEFAULT_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025'
const DEFAULT_SYSTEM_INSTRUCTION = systemPrompt
const PCM_AUDIO_MIME_TYPE = 'audio/pcm;rate=16000'
export class GoogleLiveService {
  private session: Session | null = null
  private apiKey = ''
  private ai: GoogleGenAI | null = null
  private handlers: GoogleLiveHandlers = {}
  private readonly model: string
  private readonly systemInstruction: string
  private isSessionConnecting = false
  private isSessionOpen = false
  private lastInputTranscript = ''
  private outputTurnSnapshot = ''
  private outputTurnBuffer = ''

  constructor(options: GoogleLiveOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL
    this.systemInstruction =
      options.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION
  }

  setHandlers(handlers: GoogleLiveHandlers) {
    this.handlers = handlers
  }

  async connect() {
    if (this.session && (this.isSessionConnecting || this.isSessionOpen)) {
      return
    }

    if (!this.apiKey) {
      const auth = await sessionManager.getAuth()
      this.apiKey = auth?.apiKey ?? ''
    }

    if (!this.apiKey) {
      throw new Error('GoogleLiveService requires an API key before connect().')
    }

    this.ai ??= new GoogleGenAI({ apiKey: this.apiKey })
    this.resetTurnState()
    this.isSessionConnecting = true
    this.isSessionOpen = false

    const liveConfig = {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: this.systemInstruction,
      tools: [{ functionDeclarations: [STORE_LIVE_SESSION_UPDATE_TOOL] }],
      // The Live SDK typings do not expose toolConfig, but the live API accepts
      // the same function-calling config shape used elsewhere in the SDK.
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: [STORE_LIVE_SESSION_UPDATE_TOOL.name],
        },
      },
    } as unknown as NonNullable<
      Parameters<GoogleGenAI['live']['connect']>[0]['config']
    >

    try {
      this.session = await this.ai.live.connect({
        model: this.model,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            this.isSessionConnecting = false
            this.isSessionOpen = true
            this.handlers.onOpen?.()
          },
          onmessage: (message) => {
            void this.handleMessage(message)
          },
          onerror: (event) => {
            this.handlers.onError?.(event)
          },
          onclose: (event) => {
            this.session = null
            this.isSessionConnecting = false
            this.isSessionOpen = false
            this.resetTurnState()
            this.handlers.onClose?.(event)
          },
        },
      })
    } catch (error) {
      this.session = null
      this.isSessionConnecting = false
      this.isSessionOpen = false
      throw error
    }
  }

  sendAudioChunk(chunk: Uint8Array | ArrayBuffer) {
    const session = this.session

    if (!session || !this.isSessionOpen) {
      return
    }

    const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)

    session.sendRealtimeInput({
      audio: {
        data: bytesToBase64(bytes),
        mimeType: PCM_AUDIO_MIME_TYPE,
      },
    })
  }

  disconnect() {
    const session = this.session

    if (!session) {
      return
    }

    this.isSessionConnecting = false
    this.isSessionOpen = false
    session.close()
    this.session = null
    this.handlers = {}
    this.resetTurnState()
  }

  isConnected() {
    return this.session !== null && this.isSessionOpen
  }

  private async handleMessage(message: LiveServerMessage) {
    this.handlers.onMessage?.(message)

    const functionCalls = message.toolCall?.functionCalls

    if (functionCalls?.length) {
      await this.handleToolCalls(functionCalls)
    }

    const serverContent = message.serverContent

    if (!serverContent) {
      return
    }

    const inputText = serverContent.inputTranscription?.text?.trim()

    if (inputText && inputText !== this.lastInputTranscript) {
      this.lastInputTranscript = inputText
      this.handlers.onInputTranscript?.(inputText)
    }

    const outputText = extractTextFromServerContent(message).trim()

    if (outputText) {
      if (outputText.startsWith(this.outputTurnSnapshot)) {
        this.outputTurnBuffer += outputText.slice(this.outputTurnSnapshot.length)
      } else if (outputText !== this.outputTurnSnapshot) {
        this.outputTurnBuffer += outputText
      }

      this.outputTurnSnapshot = outputText
    }

    if (serverContent.turnComplete) {
      const completedOutput = this.outputTurnBuffer.trim()

      if (completedOutput) {
        this.handlers.onOutputTranscript?.(completedOutput)
      }

      this.outputTurnSnapshot = ''
      this.outputTurnBuffer = ''
    }
  }

  private resetTurnState() {
    this.lastInputTranscript = ''
    this.outputTurnSnapshot = ''
    this.outputTurnBuffer = ''
  }

  private async handleToolCalls(functionCalls: FunctionCall[]) {
    const session = this.session

    if (!session) {
      return
    }

    const functionResponses = await Promise.all(
      functionCalls.map(async (functionCall) => {
        const functionName = functionCall.name ?? 'unknown_tool'
        const functionId = functionCall.id

        if (functionName !== STORE_LIVE_SESSION_UPDATE_TOOL.name) {
          return {
            id: functionId,
            name: functionName,
            response: {
              error: `Unsupported tool: ${functionName}`,
            },
          }
        }

        try {
          const update = parseLiveSessionUpdate(functionCall.args ?? {})
          await this.handlers.onLiveSessionUpdate?.(update)

          return {
            id: functionId,
            name: functionName,
            response: {
              output: {
                stored: true,
              },
            },
          }
        } catch (error) {
          return {
            id: functionId,
            name: functionName,
            response: {
              error: error instanceof Error ? error.message : 'Failed to store live session update.',
            },
          }
        }
      }),
    )

    session.sendToolResponse({ functionResponses })
  }
}

export const googleService = new GoogleLiveService()
