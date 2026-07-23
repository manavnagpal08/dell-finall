import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "../store/auth"

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

const getRuntimeBaseUrl = () => {
  if (typeof window === "undefined") {
    return configuredApiUrl
  }

  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    return configuredApiUrl
      .replace("http://localhost:8000", "http://127.0.0.1:8000")
      .replace("http://localhost:8000/api/v1", "http://127.0.0.1:8000/api/v1")
  }

  return configuredApiUrl
}

const apiClient = axios.create({
  baseURL: getRuntimeBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
})

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  __sancharRetry?: boolean
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

// Add request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    config.headers["X-Client-App"] = "Sanchar-AI-OS"
    try {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      console.warn("Could not retrieve auth token:", e)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableRequestConfig | undefined
    const method = config?.method?.toLowerCase()
    const canRetry =
      Boolean(config) &&
      !config?.__sancharRetry &&
      (method === "get" || method === "head") &&
      (!error.response || error.response.status === 408 || error.response.status === 429 || error.response.status >= 500)

    if (canRetry && config) {
      config.__sancharRetry = true
      await wait(650)
      return apiClient(config)
    }

    if (error.response) {
      console.error("API client error response status:", error.response.status)
      console.error("API client error response data:", error.response.data)
    } else {
      console.error("API client error message:", error.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient
