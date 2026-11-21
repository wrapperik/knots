import { CalendarDays, ListChecks, LogOut, Plus, UserRound, type LucideIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { supabase } from '@/lib/supabase'

// The shape of one navigation link. The type catches typos at build time.
type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

// Navigation links, kept as data so each page is one entry.
const workspaceItems: NavItem[] = [
  { title: 'Meetings', url: '/', icon: CalendarDays },
  { title: 'My open items', url: '/action-items', icon: ListChecks },
  { title: 'New meeting', url: '/meetings/new', icon: Plus },
]

const accountItems: NavItem[] = [
  { title: 'Account', url: '/account', icon: UserRound },
]

// Renders a list of links. Shared by the sidebar content and footer.
function NavList({ items }: { items: NavItem[] }) {
  // The current address, kept up to date by React Router.
  const { pathname } = useLocation()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          {/*
            asChild: the button passes its styling to the child <Link> instead of
            rendering its own <button>.
            tooltip: shown when the sidebar is collapsed to icons only.
          */}
          <SidebarMenuButton
            asChild
            isActive={pathname === item.url}
            tooltip={item.title}
            // The current page shows as a near-black pill.
            className="data-[active=true]:bg-sidebar-foreground data-[active=true]:text-sidebar data-[active=true]:hover:bg-sidebar-foreground data-[active=true]:hover:text-sidebar"
          >
            <Link to={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const navigate = useNavigate()

  async function handleLogOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    // collapsible="icon": on desktop the trigger shrinks the sidebar to icons
    // instead of hiding it. On mobile it always opens as a slide-out sheet.
    <Sidebar collapsible="icon" >
      <SidebarHeader>
        {/*
          The sidebar sets data-collapsible="icon" on a parent "group" when it is
          collapsed, so group-data-[collapsible=icon]: styles only apply then.
          The collapsed sidebar shows the logo mark instead of the wordmark.
        */}
        <Link
          to="/"
          aria-label="Knots home"
          className="flex items-center px-2 py-1 group-data-[collapsible=icon]:px-0"
        >
          <img
            src="/logo-wordmark.svg"
            alt=""
            className="h-15 w-auto ml-[-15px] group-data-[collapsible=icon]:hidden"
          />
          <img
            src="/logo.svg"
            alt=""
            className="hidden size-8 group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <NavList items={workspaceItems} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavList items={accountItems} />
        <SidebarMenu>
          <SidebarMenuItem>
            {/* A real button, not a link: logging out is an action, not a page. */}
            <SidebarMenuButton tooltip="Log out" onClick={handleLogOut}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
