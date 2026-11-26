import { useState } from 'react'
import { toast } from 'sonner'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { DEMO_ACCOUNTS, switchToDemoAccount, type DemoAccount } from '@/lib/demo-accounts'

// "Alex Morgan" becomes "AM", for the round badge.
function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
}

// One-click log-in as each seeded demo user. Staying on the same page after a
// switch shows data isolation: a meeting that belongs to someone else turns
// into "Meeting not found", because the database no longer returns it.
export function DemoAccountSwitcher() {
  const { session } = useAuth()
  // The email being switched to, so only that button shows it is busy.
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const currentEmail = session?.user.email ?? null

  async function handleSwitch(account: DemoAccount) {
    if (switchingTo || account.email === currentEmail) return
    setSwitchingTo(account.email)
    try {
      await switchToDemoAccount(account.email)
      toast.success(`Logged in as ${account.name}`)
    } catch (error) {
      toast.error(`Could not switch to ${account.name}`, { description: (error as Error).message })
    } finally {
      setSwitchingTo(null)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Demo accounts</SidebarGroupLabel>
      <SidebarMenu>
        {DEMO_ACCOUNTS.map((account) => {
          const isCurrent = account.email === currentEmail
          return (
            <SidebarMenuItem key={account.email}>
              <SidebarMenuButton
                // Taller than a nav link, to fit the note under the name.
                size="lg"
                isActive={isCurrent}
                // aria-pressed tells screen readers which account is in use.
                aria-pressed={isCurrent}
                disabled={switchingTo !== null}
                tooltip={`${account.name} (${account.note.toLowerCase()})`}
                onClick={() => handleSwitch(account)}
                // The account in use shows as the same light pill as the current page.
                className="data-[active=true]:bg-sidebar-foreground data-[active=true]:text-sidebar data-[active=true]:hover:bg-sidebar-foreground data-[active=true]:hover:text-sidebar"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--knots-orange) text-xs font-semibold text-white"
                >
                  {initials(account.name)}
                </span>
                <span className="grid min-w-0 leading-tight">
                  <span className="truncate font-medium">{account.name}</span>
                  <span className="truncate text-xs opacity-70">
                    {switchingTo === account.email ? 'Switching…' : account.note}
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
