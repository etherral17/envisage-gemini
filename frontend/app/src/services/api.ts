const API_BASE_URL = 'http://localhost:5000'

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
}

class ApiService {
  private apiKey: string | null = null
  private baseUrl: string = API_BASE_URL

  constructor() {
    this.apiKey = localStorage.getItem(API_KEY_STORAGE)
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'x-api-key': this.apiKey }),
    }
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Request failed: ${response.statusText}`)
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
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getData(): Promise<DataResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<DataResponse>('/data')
    } catch (error) {
      throw new Error(`Failed to get data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getWordCloud(): Promise<WordCloudResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<WordCloudResponse>('/wordcloud')
    } catch (error) {
      throw new Error(`Failed to get wordcloud: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateWordCloud(): Promise<WordCloudResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<WordCloudResponse>('/wordcloud')
    } catch (error) {
      throw new Error(`Failed to generate wordcloud: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSummary(): Promise<SummaryResponse> {
    if (!this.apiKey) {
      throw new Error('No API key. Please login first.')
    }
    try {
      return await this.request<SummaryResponse>('/summary')
    } catch (error) {
      throw new Error(`Failed to get summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
