const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api'

// Store API key in localStorage
const API_KEY_STORAGE = 'scraper_api_key'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface LoginResponse {
  'x-api-key': string
}

interface ScrapeResponse {
  message: string
  length: number
}

interface DataResponse {
  text: string
}

interface WordCloudResponse {
  wordcloud_path: string
}

interface SummaryResponse {
  summary: string
}

interface KeysResponse {
  keys: string[]
}

interface LogsResponse {
  id: number
  ip: string
  method: string
  path: string
  status: number
  timestamp: string
  [key: string]: unknown
}

interface SessionHistoryResponse {
  history: number[]
}

interface WafResponse {
  waf_enabled: boolean
  ml_available?: boolean
  blocked_ips?: string[]
  blocked_ip_count?: number
}

interface MonitoringSnapshot {
  monitor: {
    waf_enabled: boolean
    total_requests_checked: number
    blocked_requests: number
    success_requests: number
    failed_requests: number
    blocked_ips: string[]
    blocked_ip_count: number
    total_logs: number
    last_block_reason?: string | null
    last_blocked_ip?: string | null
    last_event_ts?: number | null
  }
  logs: LogsResponse[]
}

class ApiService {
  private apiKey: string | null = null
  private baseUrl: string = API_BASE_URL

  constructor() {
    this.apiKey = localStorage.getItem(API_KEY_STORAGE)
  }

  private getHeaders(includeJsonContentType = false): HeadersInit {
    return {
      ...(this.apiKey && { 'x-api-key': this.apiKey }),
      ...(includeJsonContentType && { 'Content-Type': 'application/json' }),
    }
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const hasBody = body !== undefined
    const options: RequestInit = {
      method,
      headers: this.getHeaders(hasBody),
    }

    if (hasBody) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.statusText}`
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          // keep fallback message for non-json error responses
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to complete request')
    }
  }

  // =====================
  // Auth Endpoints
  // =====================

  async login(): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/login')
      this.apiKey = response['x-api-key']
      localStorage.setItem(API_KEY_STORAGE, this.apiKey)
      return response
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listKeys(): Promise<KeysResponse> {
    try {
      return await this.request<KeysResponse>('/keys')
    } catch (error) {
      throw new Error(`Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // =====================
  // Scraping Endpoints
  // =====================

  async scrape(url: string): Promise<ScrapeResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<ScrapeResponse>('/scrape', 'POST', { url })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (/invalid key/i.test(message)) {
        await this.login()
        return await this.request<ScrapeResponse>('/scrape', 'POST', { url })
      }
      throw new Error(`Scraping failed: ${message}`)
    }
  }

  async getData(): Promise<DataResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<DataResponse>('/data')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (/invalid key/i.test(message)) {
        await this.login()
        return await this.request<DataResponse>('/data')
      }
      throw new Error(`Failed to get data: ${message}`)
    }
  }

  async getWordCloud(): Promise<WordCloudResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<WordCloudResponse>('/wordcloud')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (/invalid key/i.test(message)) {
        await this.login()
        return await this.request<WordCloudResponse>('/wordcloud')
      }
      throw new Error(`Failed to get wordcloud: ${message}`)
    }
  }

  async generateWordCloud(): Promise<WordCloudResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<WordCloudResponse>('/wordcloud')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (/invalid key/i.test(message)) {
        await this.login()
        return await this.request<WordCloudResponse>('/wordcloud')
      }
      throw new Error(`Failed to generate wordcloud: ${message}`)
    }
  }

  async getSummary(): Promise<SummaryResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<SummaryResponse>('/summary')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (/invalid key/i.test(message)) {
        await this.login()
        return await this.request<SummaryResponse>('/summary')
      }
      throw new Error(`Failed to get summary: ${message}`)
    }
  }

  // =====================
  // Logging Endpoints
  // =====================

  async getLogs(limit?: number): Promise<LogsResponse[]> {
    try {
      const endpoint = limit ? `/logs?limit=${limit}` : '/logs'
      return await this.request<LogsResponse[]>(endpoint)
    } catch (error) {
      throw new Error(`Failed to get logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSessionHistory(): Promise<SessionHistoryResponse> {
    try {
      return await this.request<SessionHistoryResponse>('/session/history')
    } catch (error) {
      throw new Error(`Failed to get session history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // =====================
  // WAF Endpoints
  // =====================

  async toggleWaf(action: 'enable' | 'disable'): Promise<WafResponse> {
    try {
      return await this.request<WafResponse>(`/waf/${action}`, 'POST')
    } catch (error) {
      throw new Error(`Failed to toggle WAF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getWafStatus(): Promise<WafResponse> {
    try {
      return await this.request<WafResponse>('/waf/status')
    } catch (error) {
      throw new Error(`Failed to fetch WAF status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMonitoring(limit = 50): Promise<MonitoringSnapshot> {
    try {
      return await this.request<MonitoringSnapshot>(`/monitoring?limit=${limit}`)
    } catch (error) {
      throw new Error(`Failed to fetch monitoring details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // =====================
  // Utility Methods
  // =====================

  getApiKey(): string | null {
    return this.apiKey
  }

  setApiKey(key: string): void {
    this.apiKey = key
    localStorage.setItem(API_KEY_STORAGE, key)
  }

  getImageUrl(path: string): string {
    // Construct full backend URL for image paths
    if (path.startsWith('http')) {
      return path
    }
    return `${this.baseUrl}${path}`
  }

  clearApiKey(): void {
    this.apiKey = null
    localStorage.removeItem(API_KEY_STORAGE)
  }

  isAuthenticated(): boolean {
    return !!this.apiKey
  }
}

export const apiService = new ApiService()
