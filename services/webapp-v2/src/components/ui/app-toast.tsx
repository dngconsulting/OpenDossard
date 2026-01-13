import { AlertTriangle, Check, ChevronDown, ChevronUp, CircleCheck, CircleX, Copy, Info, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export type ToastType = 'error' | 'success' | 'info' | 'warning'

interface ToastConfig {
  bg: string
  icon: React.ReactNode
  title: string
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  error: {
    bg: 'bg-[#9e2b2b]',
    icon: <CircleX className="h-5 w-5 text-white" />,
    title: 'Erreur',
  },
  success: {
    bg: 'bg-[#5cb85c]',
    icon: <CircleCheck className="h-5 w-5 text-white" />,
    title: 'Succès',
  },
  info: {
    bg: 'bg-[#8066dc]',
    icon: <Info className="h-5 w-5 text-white" />,
    title: 'Information',
  },
  warning: {
    bg: 'bg-[#d9831a]',
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
    title: 'Attention',
  },
}

export interface AppToastProps {
  id: string | number
  type: ToastType
  message: string
  details?: string
}

export function AppToast({ id, type, message, details }: AppToastProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const config = toastConfigs[type]

  const handleCopy = async () => {
    if (!details) return
    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = details
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDismiss = () => {
    toast.dismiss(id)
  }

  return (
    <div className={`w-[356px] ${config.bg} rounded-lg shadow-lg overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{config.title}</p>
            <p className="text-sm text-white/90 mt-1">{message}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {details && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    Masquer <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Détail <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && details && (
          <div className="mt-3 space-y-2">
            <div className="bg-black/20 rounded-md p-3 max-h-48 overflow-auto">
              <pre className="text-xs font-mono text-white/90 whitespace-pre-wrap break-all">
                {details}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-2 text-green-300" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-2" />
                  Copier les détails
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
