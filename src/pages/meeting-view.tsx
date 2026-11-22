import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'

// Placeholder transcript until meetings are loaded from the database.
const transcript = `[09:30] Alex: Morning all. Let's start with the launch date.
[09:31] Sam: Design is ready. I can hand over the final screens by Friday.
[09:33] Alex: Great. Then we agree to launch on 1 December.`

export function MeetingView() {
    const [copied, setCopied] = useState(false)
    const [copyError, setCopyError] = useState(false)

    // Copies the transcript and shows "Copied" for two seconds.
    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(transcript)
            setCopyError(false)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopyError(true)
        }
    }

    return (
        <>
            <header className="flex h-14 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <h1 className="font-sans text-lg font-medium">Detailed View</h1>
            </header>
            <div className="h-[calc(100svh-3.5rem)]">
                <ResizablePanelGroup orientation="horizontal">
                    <ResizablePanel defaultSize="40%">
                        <ResizablePanelGroup orientation="vertical">
                            <ResizablePanel defaultSize="35%">
                                <div className="m-5">
                                    <h2 className="text-lg font-bold">Summary and action items</h2>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />

                            <ResizablePanel defaultSize="65%">
                                <div className="m-5">
                                    <h2 className="text-lg font-bold">Decisions</h2>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize="60%">
                        <div className="flex h-full flex-col gap-3 p-5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-lg font-bold">Transcript</h2>
                                <Button size="sm" variant="outline" onClick={handleCopy}>
                                    {copied ? <CheckIcon /> : <CopyIcon />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            {copyError && (
                                <p role="alert" className="text-sm text-destructive">
                                    Could not copy the transcript. Select the text and copy it manually.
                                </p>
                            )}
                            <label htmlFor="transcript" className="sr-only">Transcript</label>
                            <Textarea
                                id="transcript"
                                value={transcript}
                                readOnly
                                className="min-h-0 flex-1 resize-none field-sizing-fixed bg-white"
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    )
}
