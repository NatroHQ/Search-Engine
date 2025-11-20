export function generateSessionId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("natro_session_id")
    if (stored) return stored

    const newId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    localStorage.setItem("natro_session_id", newId)
    return newId
  }

  return "anonymous"
}

export function hasConsent(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("natro_consent") === "accepted"
  }
  return false
}

export function setConsent(accepted: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("natro_consent", accepted ? "accepted" : "declined")
  }
}
