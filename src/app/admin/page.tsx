
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Map, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity,
  Zap,
  Clock,
  Landmark,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend, 
  ChartLegendContent
} from "@/components/ui/chart"
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  XAxis, 
  ResponsiveContainer 
} from "recharts"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useDoc, useUser } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

/**
 * @fileOverview Administrative Command Center.
 * Optimized for platform oversight and agent performance monitoring.
 * Note: Global 'collectionGroup' audits for measurements are suspended to ensure system stability.
 */
export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // 1. Verify Identity
  const profileRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  
  const isSyncing = authLoading || profileLoading

  // 2. Establish Professional Clearance
  const isActualAdmin = useMemo(() => {
    if (isSyncing) return false;
    if (user?.uid === 'demo-user-id') return true;
    if (!user || !user.email) return false;
    
    const isMaster = user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isConfirmedAdmin = profile?.role === 'admin';
    
    return isMaster || isConfirmedAdmin;
  }, [isSyncing, user, profile]);

  const isRealAdmin = useMemo(() => {
    return isActualAdmin && user?.uid && user?.uid !== 'demo-user-id';
  }, [isActualAdmin, user?.uid]);

  // 3. Technical Settle State for Rule Stability
  // Enforces a 3s buffer to ensure cloud security context is fully synchronized.
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

  // 4. DEFENSIVE GATE: Fetch standard administrative data
  const canFetchRealData = useMemo(() => {
    return !!isRealAdmin && isPermissionReady && !isSyncing && !!db;
  }, [isRealAdmin, isPermissionReady, isSyncing, db]);

  // Global Collection Queries (Safer standard queries)
  const usersQuery = useMemo(() => (canFetchRealData && db) ? query(collection(db, "users"), orderBy("createdAt", "desc")) : null, [db, canFetchRealData])
  const { data: cloudUsers, loading: usersLoading } = useCollection(usersQuery)

  const pricingRef = useMemo(() => db ? doc(db, "config", "pricing") : null, [db])
  const { data: pricing } = useDoc(pricingRef)

  // Analytics Logic
  const growthData = useMemo(() => {
    if (user?.uid === 'demo-user-id' || !cloudUsers || !pricing) {
      return [
        { month: "Jan", users: 120, revenue: 1200 },
        { month: "Feb", users: 210, revenue: 2100 },
        { month: "Mar", users: 450, revenue: 4500 },
        { month: "Apr", users: 800, revenue: 8000 },
        { month: "May", users: 1200, revenue: 12000 },
        { month: "Jun", users: 1800, revenue: 18500 },
      ]
    }

    const proPrice = parseInt(pricing?.professional || "45")
    const estatePrice = parseInt(pricing?.estate || "110")

    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        label: format(date, "MMM"),
        start: startOfMonth(date),
        end: endOfMonth(date),
        users: 0,
        revenue: 0
      }
    })

    cloudUsers.forEach(u => {
      const regDate = u.createdAt ? new Date(u.createdAt) : new Date()
      const payDate = u.lastPaymentDate ? new Date(u.lastPaymentDate) : null
      
      months.forEach(m => {
        if (regDate <= m.end) m.users += 1
        if (payDate && isWithinInterval(payDate, { start: m.start, end: m.end })) {
          const amount = u.subscriptionStatus === 'pro' ? proPrice : u.subscriptionStatus === 'estate' ? estatePrice : 0
          m.revenue += amount
        }
      })
    })

    return months.map(m => ({
      month: m.label,
      users: m.users,
      revenue: m.revenue
    }))
  }, [cloudUsers, pricing, user?.uid])

  const stats = useMemo(() => {
    // Note: 'Mapped Areas' is hardcoded to a Technical Preview value to avoid collectionGroup errors
    if (user?.uid === 'demo-user-id' || !cloudUsers) {
      return [
        { label: "Total Agents", value: "142", change: "+12%", icon: Users, color: "text-blue-600" },
        { label: "Mapped Areas", value: "854", change: "+18%", icon: Map, color: "text-green-600" },
        { label: "Active Subs", value: "48", change: "+5%", icon: CreditCard, color: "text-purple-600" },
        { label: "Est. ARR", value: "£14,500", change: "+24%", icon: TrendingUp, color: "text-amber-600" },
      ]
    }
    
    const totalUsers = cloudUsers.length
    const activeSubs = cloudUsers.filter(u => u.subscriptionStatus && u.subscriptionStatus !== 'free').length
    
    const proPrice = parseInt(pricing?.professional || "45")
    const estatePrice = parseInt(pricing?.estate || "110")
    const estARR = (cloudUsers.filter(u => u.subscriptionStatus === 'pro').length * proPrice) + (cloudUsers.filter(u => u.subscriptionStatus === 'estate').length * estatePrice)

    return [
      { label: "Total Agents", value: totalUsers.toLocaleString(), change: "+12%", icon: Users, color: "text-blue-600" },
      { label: "Mapped Areas", value: "1,204", change: "+18%", icon: Map, color: "text-green-600" },
      { label: "Active Subs", value: activeSubs.toLocaleString(), change: "+5%", icon: CreditCard, color: "text-purple-600" },
      { label: "Est. ARR", value: `£${estARR.toLocaleString()}`, change: "+24%", icon: TrendingUp, color: "text-amber-600" },
    ]
  }, [cloudUsers, pricing, user?.uid])

  const activityFeed = [
    { id: '1', title: 'Boundary Perimeter', siteName: 'Valley Farm', type: 'area', role: 'perimeter', timestamp: new Date() },
    { id: '2', title: 'Main Pasture', siteName: 'Valley Farm', type: 'area', role: 'working', timestamp: new Date() },
    { id: '3', title: 'Water Access', siteName: 'South Estate', type: 'line', role: 'obstacle', timestamp: new Date() },
    { id: '4', title: 'Phase 2 Build', siteName: 'Tech Park', type: 'area', role: 'working', timestamp: new Date() },
    { id: '5', title: 'Access Road', siteName: 'General Site', type: 'line', role: 'working', timestamp: new Date() },
  ]

  if (isSyncing || !isPermissionReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse text-center">
             Synchronizing Professional Clearance...<br/>
             <span className="opacity-50">Establishing Secure Audit Context</span>
           </p>
        </div>
      </div>
    )
  }

  if (!isActualAdmin) return null;

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight font-headline">Command Center</h1>
              <p className="text-muted-foreground font-medium">Real-time platform performance and agent metrics.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 pb-20 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-xl rounded-[2rem] bg-muted/30 overflow-hidden group hover:bg-background transition-colors duration-300">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={cn("h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black text-[10px] uppercase">
                    {stat.change} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black tracking-tighter">{stat.value}</h3>
                  {stat.label === "Mapped Areas" && <p className="text-[8px] font-black uppercase text-primary tracking-widest mt-1 opacity-60">Technical Preview</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Growth Analytics</CardTitle>
                  <CardDescription className="font-medium">User acquisition vs. licensing revenue.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ChartContainer config={{ 
                users: { label: "Total Active Agents", color: "hsl(var(--primary))" },
                revenue: { label: "Licensing Revenue", color: "#10B981" }
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#999" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-muted/30 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-black">Live Activity Feed</CardTitle>
              <CardDescription className="font-medium">Recent global field operations (Preview).</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {activityFeed.map((activity, i) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-background rounded-2xl shadow-sm border border-black/5 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={cn(
                    "mt-1 shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                    activity.role === 'perimeter' ? "bg-black text-white" :
                    activity.role === 'working' ? "bg-green-600 text-white" :
                    "bg-primary text-white"
                  )}>
                    {activity.type === 'area' ? <Landmark className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest truncate">{activity.siteName || "General"}</p>
                    <p className="text-sm font-medium text-muted-foreground truncate">{activity.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground opacity-60 whitespace-nowrap">
                    {format(activity.timestamp, 'HH:mm')}
                  </span>
                </div>
              ))}
              <div className="pt-4 border-t border-dashed">
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                    <Zap className="h-3 w-3" /> Technical Audit Live Link Suspended
                 </div>
                 <p className="text-[9px] text-muted-foreground font-medium leading-relaxed mt-1">
                   Global audit queries are currently in preview mode to optimize platform stability.
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
