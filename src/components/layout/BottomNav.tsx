
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, User, LayoutDashboard, Calculator, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase"
import { useMemo } from "react"

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = useMemo(() => {
    const items = [{ label: 'Map', href: '/measure', icon: Map }]
    
    if (user) {
      items.push(
        { label: 'History', href: '/history', icon: LayoutDashboard },
        { label: 'Vault', href: '/reports', icon: FileText },
        { label: 'Audit', href: '/audit', icon: Calculator },
        { label: 'Profile', href: '/profile', icon: User }
      )
    }
    
    return items
  }, [user])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t h-16 flex items-center justify-around px-4 pb-safe md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-16 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-medium font-headline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
