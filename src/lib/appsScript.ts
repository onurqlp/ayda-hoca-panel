export interface AppsScriptRunner {
  withSuccessHandler(handler: (value: unknown) => void): AppsScriptRunner
  withFailureHandler(handler: (reason: unknown) => void): AppsScriptRunner
  api(request: string): void
}

declare global {
  interface Window {
    google?: { script?: { run?: AppsScriptRunner } }
  }
}

export function isAppsScriptHost() {
  return Boolean(window.google?.script?.run)
}

function errorMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message
  if (typeof reason === 'object' && reason && 'message' in reason) return String(reason.message)
  return String(reason || 'Google Apps Script isteği başarısız oldu.')
}

export function callAppsScript<T>(action: string, payload: unknown = {}): Promise<T> {
  const runner = window.google?.script?.run
  if (!runner) return Promise.reject(new Error('Panel Google Apps Script içinden açılmalıdır.'))

  return new Promise<T>((resolve, reject) => {
    runner
      .withSuccessHandler((value) => resolve(value as T))
      .withFailureHandler((reason) => reject(new Error(errorMessage(reason))))
      .api(JSON.stringify({ action, payload }))
  })
}
