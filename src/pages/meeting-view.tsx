import { useState } from 'react'
import { CheckIcon, CircleIcon, CopyIcon, GavelIcon, WaypointsIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Textarea } from '@/components/ui/textarea'
import { WaveBackground } from '@/components/wave-background'

// Placeholder transcript until meetings are loaded from the database.
const transcript = `[09:30] Alex: Morning all. Let's start with the launch date.
[09:31] Sam: Design is ready. I can hand over the final screens by Friday.
[09:33] Alex: Great. Then we agree to launch on 1 December.`

// Placeholder decisions agreed in the meeting.
const decisions = [
    { id: '1', text: 'Move the Horizon Pay public release from 4 December to 15 January 2027' },
    { id: '2', text: 'Hold paid ads until 8 January 2027' },
    { id: '3', text: 'Lift the press embargo on launch morning' },
]

// Placeholder action items. A missing owner or date stays null, never guessed.
const actionItems = [
    { id: '1', text: 'Run regression tests on the payment-gateway edge cases', owner: 'QA team', dueDate: '10 January 2027' },
    { id: '2', text: 'Hold paid ads until the new launch date', owner: 'Marketing', dueDate: '8 January 2027' },
    { id: '3', text: 'Move the press embargo to launch morning', owner: null, dueDate: null },
]

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
                    <ResizablePanel defaultSize="40%" className="relative">
                        <WaveBackground />

                        {/* Scrolls on its own, so the waves stay fixed behind the content. */}
                        <div className="relative h-full space-y-6 overflow-y-auto p-5">
                            <h2 className="text-lg font-bold">Summary</h2>

                            <section className="rounded-lg border bg-white/65 p-5">
                                <h3 className="flex items-center gap-2 pb-2 font-medium">
                                    <WaypointsIcon className="size-4 text-primary" aria-hidden="true" />
                                    AI Overview
                                </h3>
                                <p>During today's launch readiness sync, the team moved the public release of Horizon Pay from December 4 to January 15 after QA flagged two payment-gateway edge cases that need extra regression testing. Marketing agreed to hold paid ads until January 8 and shift the press embargo to launch morning.</p>
                            </section>

                            <section aria-labelledby="decisions-heading">
                                <h3 id="decisions-heading" className="flex items-center gap-2 pb-2 font-medium">
                                    Decisions
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {decisions.length}
                                    </span>
                                </h3>
                                <ItemGroup className="gap-2">
                                    {decisions.map((decision) => (
                                        <Item
                                            key={decision.id}
                                            role="listitem"
                                            variant="outline"
                                            size="xs"
                                            className="bg-white/95"
                                        >
                                            <ItemMedia>
                                                <GavelIcon className="size-4 text-primary" aria-hidden="true" />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle>{decision.text}</ItemTitle>
                                            </ItemContent>
                                        </Item>
                                    ))}
                                </ItemGroup>
                            </section>

                            <section aria-labelledby="action-items-heading">
                                <h3 id="action-items-heading" className="flex items-center gap-2 pb-2 font-medium">
                                    Action items
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {actionItems.length}
                                    </span>
                                </h3>
                                <ItemGroup className="gap-2">
                                    {actionItems.map((item) => (
                                        <Item
                                            key={item.id}
                                            role="listitem"
                                            variant="outline"
                                            size="xs"
                                            className="bg-white/95"
                                        >
                                            <ItemMedia>
                                                <CircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                                            </ItemMedia>
                                            <ItemContent>
                                                <ItemTitle>{item.text}</ItemTitle>
                                                <ItemDescription className="text-xs">
                                                    {item.owner ?? 'No owner'} · {item.dueDate ?? 'No due date'}
                                                </ItemDescription>
                                            </ItemContent>
                                        </Item>
                                    ))}
                                </ItemGroup>
                            </section>
                        </div>
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
