import { useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { FileText, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ACCEPTED_TRANSCRIPT_TYPES,
  MAX_TRANSCRIPT_BYTES,
  describeRejection,
  hasAcceptedExtension,
} from '@/lib/transcript-file'
import { cn } from '@/lib/utils'

type TranscriptDropzoneProps = {
  // Called with the file's text once it has been read successfully.
  onTranscriptRead: (text: string, file: File) => void
  // Called when the user removes the chosen file.
  onClear: () => void
}

export function TranscriptDropzone({ onTranscriptRead, onClear }: TranscriptDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)

  async function handleDrop(acceptedFiles: File[], rejectedFiles: FileRejection[]) {
    setError(null)

    if (rejectedFiles.length > 0) {
      setError(describeRejection(rejectedFiles[0]))
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    if (!hasAcceptedExtension(file.name)) {
      setError('That file type is not supported. Upload a .txt, .vtt or .md transcript.')
      return
    }

    setIsReading(true)
    try {
      // Read the file in the browser. Nothing is uploaded yet.
      const text = await file.text()
      if (text.trim().length === 0) {
        setError('That file is empty. Choose a transcript with some text in it.')
        return
      }
      setFileName(file.name)
      onTranscriptRead(text, file)
    } catch {
      setError('We could not read that file. Try again, or paste the transcript instead.')
    } finally {
      setIsReading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TRANSCRIPT_TYPES,
    maxSize: MAX_TRANSCRIPT_BYTES,
    maxFiles: 1,
    multiple: false,
    disabled: isReading,
    onDrop: handleDrop,
  })

  function handleClear() {
    setFileName(null)
    setError(null)
    onClear()
  }

  // Once a file is chosen, show it instead of the drop area.
  if (fileName) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{fileName}</p>
        <Button variant="ghost" size="icon-sm" onClick={handleClear} aria-label="Remove file">
          <X />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps({
          role: 'button',
          'aria-label': 'Upload a transcript',
          className: cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed',
            ' px-6 py-12 text-center transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring',
            isDragActive && 'border-primary bg-primary/5',
            isReading && 'cursor-wait opacity-60',
          ),
        })}
      >
        <input {...getInputProps()} />
        {/* Looks like a button, but the whole drop area is the clickable control. */}
        <span className="mb-2 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 font-medium text-background shadow-sm">
          <Upload className="size-4" aria-hidden="true" />
          Upload
        </span>
        <p className="font-medium">
          {isDragActive ? 'Drop the transcript here' : 'Choose a file or drag and drop it here'}
        </p>
        <p className="text-sm text-muted-foreground">.txt, .vtt or .md, up to 1 MB</p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
