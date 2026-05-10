import { toast } from "sonner"

export function toastCopied(what = "Copied to clipboard") {
  toast.success("Copied", { description: what })
}

export function toastRateLimited(message: string) {
  toast.warning("Daily limit", { description: message })
}

export function toastDraftContinued() {
  toast.info("Draft carried forward", { description: "Continue in Validate." })
}

export function toastGenericError(message: string) {
  toast.error("Something stalled", { description: message })
}
