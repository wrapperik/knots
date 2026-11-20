import { useState } from 'react'

import { TranscriptDropzone } from '@/components/transcript-dropzone'
import { cn } from '@/lib/utils'

type NewMeetingPanelProps = {
  // "center" on the empty homepage, "start" beside the meetings list.
  align?: 'center' | 'start'
}

// The heading, dropzone and transcript preview. Shared by both homepage layouts.
export function NewMeetingPanel({ align = 'center' }: NewMeetingPanelProps) {
  const [transcript, setTranscript] = useState<string | null>(null)
  const isCentred = align === 'center'

  return (
    <section aria-labelledby="new-meeting-heading" className="space-y-6">
      <div className={cn('space-y-2', isCentred && 'text-center')}>
        <h2 id="new-meeting-heading" className={isCentred ? 'text-4xl' : 'text-2xl'}>
          {isCentred ? 'Tie up your meeting' : 'New meeting'}
        </h2>
        <p className="text-muted-foreground">
          Upload a transcript to get a summary, decisions and action items.
        </p>
      </div>

      <TranscriptDropzone
        onTranscriptRead={(text) => setTranscript(text)}
        onClear={() => setTranscript(null)}
      />

      {/* Preview of the first 1,000 characters of the transcript. */}
      {transcript && (
        <pre className="max-h-48 overflow-auto rounded-lg border bg-card p-4 text-xs whitespace-pre-wrap">
          {transcript.slice(0, 1000)}
        </pre>
      )}
    </section>
  )
}
