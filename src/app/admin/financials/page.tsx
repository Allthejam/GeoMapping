
"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Target,
  Download,
  Calendar,
  Layers,
  Zap,
  Star,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

const subConfig = {
  free: { label: "Field Explorer (Free)", color: "#94a3b8" },
  pro: { label: "Professional", color: "#2D5BFF" },
  estate: { label: "Estate Manager", color: "#10B981" },
} satisfies ChartConfig

export default function FinancialsPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // Verify Admin Status
  const profileRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  
  const isSyncing = authLoading || profileLoading

  const isActualAdmin = useMemo(() => {
    if (isSyncing) return false;
    if (user?.uid === 'demo-user-id') return true;
    if (!user || !user.email) return false;
    return user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || profile?.role === 'admin';
  }, [isSyncing, user, profile]);

  const isRealAdmin = useMemo(() => {
    return isActualAdmin && user?.uid !== 'demo-user-id';
  }, [isActualAdmin, user?.uid]);

  // Technical Settle State for Rule Stability
  const [isPermissionReady, setIsPermissionReady] = useState(false);

  useEffect(() => {
    if (isActualAdmin) {
      const timer = setTimeout(() => setIsPermissionReady(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsPermissionReady(false);
    }
  }, [isActualAdmin]);

  useEffect(() => {
    if (!isSyncing && !isActualAdmin) {
      router.push("/measure")
    }
  }, [isSyncing, isActualAdmin, router])

  // Guard privileged query for "Live" data
  const canFetchRealData = isRealAdmin && isPermissionReady && !isSyncing && !!db;
  const usersQuery = useMemo(() => (canFetchRealData) ? collection(db, "users") : null, [db, canFetchRealData])
  const { data: cloudUsers } = useCollection(usersQuery)

  // Pricing for ARR calculations
  const pricingRef = useMemo(() => db ? doc(db, "config", "pricing") : null, [db])
  const { data: pricing } = useDoc(pricingRef)

  // DYNAMIC REVENUE DATA (Derived from Live Users)
  const revenueData = useMemo(() => {
    if (user?.uid === 'demo-user-id') {
       return [
        { month: "Jan", revenue: 450, recurring: 300 },
        { month: "Feb", revenue: 520, recurring: 380 },
        { month: "Mar", revenue: 610, recurring: 420 },
        { month: "Apr", revenue: 840, recurring: 550 },
        { month: "May", revenue: 1020, recurring: 780 },
        { month: "Jun", revenue: 1250, recurring: 920 },
      ]
    }

    if (!cloudUsers || !pricing) return []

    const proPrice = parseInt(pricing?.professional || "45")
    const estatePrice = parseInt(pricing?.estate || "110")

    // Generate last 6 months list
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        label: format(date, "MMM"),
        start: startOfMonth(date),
        end: endOfMonth(date),
        revenue: 0,
        recurring: 0
      }
    })

    cloudUsers.forEach(u => {
      if (!u.lastPaymentDate) return
      const payDate = new Date(u.lastPaymentDate)
      
      months.forEach(m => {
        if (isWithinInterval(payDate, { start: m.start, end: m.end })) {
          const amount = u.subscriptionStatus === 'pro' ? proPrice : u.subscriptionStatus === 'estate' ? estatePrice : 0
          m.revenue += amount
          if (u.lastPaymentType === 'subscription') {
            m.recurring += amount
          }
        }
      })
    })

    return months.map(m => ({
      month: m.label,
      revenue: m.revenue,
      recurring: m.recurring
    }))
  }, [cloudUsers, pricing, user?.uid])

  const stats = useMemo(() => {
    if (user?.uid === 'demo-user-id') {
      return {
        mrr: "£9,240",
        conversion: 5.2,
        avgBasket: "£72.50",
        totalUnits: 1720,
        subData: [
          { name: 'free', value: 1200, fill: '#94a3b8' },
          { name: 'pro', value: 412, fill: '#2D5BFF' },
          { name: 'estate', value: 108, fill: '#10B981' },
        ]
      }
    }

    if (!cloudUsers) return null

    const total = cloudUsers.length
    const freeCount = cloudUsers.filter(u => !u.subscriptionStatus || u.subscriptionStatus === 'free').length
    const proCount = cloudUsers.filter(u => u.subscriptionStatus === 'pro').length
    const estateCount = cloudUsers.filter(u => u.subscriptionStatus === 'estate').length

    const proPrice = parseInt(pricing?.professional || "45")
    const estatePrice = parseInt(pricing?.estate || "110")
    
    // Estimate MRR based on current active license values
    const monthlyMRR = ((proCount * proPrice) + (estateCount * estatePrice)) / 12
    const conversion = total > 0 ? ((proCount + estateCount) / total) * 100 : 0
    const avgBasket = (proCount + estateCount) > 0 ? ((proCount * proPrice) + (estateCount * estatePrice)) / (proCount + estateCount) : 0

    return {
      mrr: `£${Math.round(monthlyMRR).toLocaleString()}`,
      conversion: conversion.toFixed(1),
      avgBasket: `£${Math.round(avgBasket).toLocaleString()}`,
      totalUnits: total,
      subData: [
        { name: 'free', value: freeCount, fill: '#94a3b8' },
        { name: 'pro', value: proCount, fill: '#2D5BFF' },
        { name: 'estate', value: estateCount, fill: '#10B981' },
      ]
    }
  }, [cloudUsers, pricing, user?.uid])

  if (isSyncing || !isPermissionReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActualAdmin) return null;

  const currentStats = stats || {
    mrr: "£0",
    conversion: "0.0",
    avgBasket: "£0",
    totalUnits: 0,
    subData: [
      { name: 'free', value: 0, fill: '#94a3b8' },
      { name: 'pro', value: 0, fill: '#2D5BFF' },
      { name: 'estate', value: 0, fill: '#10B981' },
    ]
  }

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-headline">Financial Operations</h1>
            <p className="text-muted-foreground font-medium">Revenue tracking and subscription health.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-12 rounded-xl font-bold gap-2">
              <Download className="h-4 w-4" /> Export Ledger
            </Button>
            <Button className="h-12 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20">
              <Calendar className="h-4 w-4" /> Fiscal Period
            </Button>
          </div>
        </div>
      </header>

      <main className="px-8 pb-20 space-y-8">
        {/* Money Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-primary text-white overflow-hidden relative">
            <TrendingUp className="absolute -right-4 -top-4 h-32 w-32 opacity-10" />
            <CardContent className="p-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Est. Monthly Recurring Revenue</p>
                <h3 className="text-4xl font-black tracking-tighter">{currentStats.mrr}</h3>
              </div>
              <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">
                Live Active Pipeline
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-muted/30 overflow-hidden">
            <CardContent className="p-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-green-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Conversion Rate</p>
                <h3 className="text-4xl font-black tracking-tighter">{currentStats.conversion}%</h3>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={parseFloat(currentStats.conversion as string)} className="h-2 flex-1" />
                <span className="text-[10px] font-black text-primary">Target: 8%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-muted/30 overflow-hidden">
            <CardContent className="p-10 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-amber-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Avg. Professional ARPU</p>
                <h3 className="text-4xl font-black tracking-tighter">{currentStats.avgBasket}</h3>
              </div>
              <p className="text-xs font-bold text-muted-foreground">Est. per business agent.</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-black">Monthly Revenue Pipeline</CardTitle>
              <CardDescription className="font-medium">Live earnings based on agent subscription and licensing activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ChartContainer config={{ 
                revenue: { label: "Total Gross Earnings", color: "#10B981" },
                recurring: { label: "Recurring License MRR", color: "hsl(var(--primary))" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#999" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="recurring" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-black">Subscription Density</CardTitle>
              <CardDescription className="font-medium">Distribution of technical tiers across active agents.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px] flex items-center justify-center">
              <div className="relative h-full w-full">
                <ChartContainer config={subConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentStats.subData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                        nameKey="name"
                      >
                        {currentStats.subData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                  <span className="text-4xl font-black tracking-tighter">{currentStats.totalUnits}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Agents</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
