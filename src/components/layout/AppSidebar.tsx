
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Map, 
  LayoutDashboard, 
  User, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  ArrowLeftRight,
  ChevronRight,
  MessageSquare,
  Calculator,
  Globe,
  FileText
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import LinkNext from "next/link"
import { useUser, useFirestore, useAuth, useDoc } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Badge } from "@/components/ui/badge"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  
  const profileRef = React.useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc(profileRef)

  const isAdmin = React.useMemo(() => {
    if (user?.uid === 'demo-user-id') return true
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) return true
    return profile?.role === 'admin'
  }, [user, profile])

  const [viewMode, setViewMode] = React.useState<"app" | "admin">("app")

  // Sync viewMode with pathname
  React.useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setViewMode("admin")
    } else {
      setViewMode("app")
    }
  }, [pathname])

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth)
      localStorage.removeItem('geo_demo_user')
      router.push("/")
    }
  }

  const appItems = [
    { label: 'Mapping', href: '/measure', icon: Map },
    { label: 'History', href: '/history', icon: LayoutDashboard },
    { label: 'Reports Vault', href: '/reports', icon: FileText },
    { label: 'Estate Audit', href: '/audit', icon: Calculator },
    { label: 'Profile', href: '/profile', icon: User }
  ]

  const adminItems = [
    { label: 'Command Center', href: '/admin', icon: ShieldCheck },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Communications', href: '/admin/messages', icon: MessageSquare },
    { label: 'Financials', href: '/admin/financials', icon: CreditCard },
    { label: 'SEO Manager', href: '/admin/seo', icon: Globe },
    { label: 'Price Settings', href: '/admin/settings', icon: Settings }
  ]

  const currentItems = viewMode === "admin" ? adminItems : appItems

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 hidden md:flex">
      <SidebarHeader className="p-4 space-y-4">
        <LinkNext href="/" className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:px-0 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <MapPin className="h-5 w-5 text-white fill-current" />
          </div>
          <span className="font-black text-xl tracking-tight group-data-[collapsible=icon]:hidden">GeoMapping</span>
        </LinkNext>

        {isAdmin && (
          <div className="group-data-[collapsible=icon]:hidden px-1">
            <button 
              onClick={() => {
                const nextMode = viewMode === "app" ? "admin" : "app"
                setViewMode(nextMode)
                router.push(nextMode === "admin" ? "/admin" : "/measure")
              }}
              className={cn(
                "w-full h-10 rounded-xl flex items-center justify-between px-3 border transition-all duration-300",
                viewMode === "admin" 
                  ? "bg-secondary text-secondary-foreground border-secondary" 
                  : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest truncate">
                  {viewMode === "admin" ? "Switch to App" : "Admin Office"}
                </span>
              </div>
              <ChevronRight className={cn("h-3 w-3 transition-transform", viewMode === "admin" && "rotate-180")} />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-black uppercase tracking-widest opacity-50">
            {viewMode === "admin" ? "Administration" : "Field Mapping"}
          </SidebarGroupLabel>
          <SidebarMenu>
            {currentItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "h-12 rounded-xl transition-all duration-200",
                      isActive 
                        ? (viewMode === "admin" ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : "bg-primary/10 text-primary hover:bg-primary/15")
                        : "hover:bg-muted"
                    )}
                  >
                    <LinkNext href={item.href}>
                      <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                      <span className="font-bold text-sm tracking-wide">{item.label}</span>
                    </LinkNext>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40 group-data-[collapsible=icon]:p-2">
        {user ? (
          <div className="flex items-center gap-3 mb-4 px-1 group-data-[collapsible=icon]:hidden">
            <Avatar className="h-9 w-9 rounded-xl border border-border shadow-sm">
              <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
              <AvatarFallback className="rounded-xl font-bold bg-primary/10 text-primary">{user.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black truncate leading-tight">{user.displayName || 'User'}</p>
                {isAdmin && <ShieldCheck className="h-2.5 w-2.5 text-primary" />}
              </div>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{user.email}</p>
            </div>
            <SidebarMenuButton 
              size="sm" 
              onClick={handleSignOut} 
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4 group-data-[collapsible=icon]:hidden px-1">
             <SidebarMenuButton asChild className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
                <LinkNext href="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="font-bold text-xs uppercase tracking-widest">Sign In</span>
                </LinkNext>
             </SidebarMenuButton>
          </div>
        )}
        <SidebarTrigger className="h-10 w-full group-data-[collapsible=icon]:w-10 rounded-xl" />
      </SidebarFooter>
    </Sidebar>
  )
}
