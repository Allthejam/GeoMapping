
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  Search, 
  Landmark, 
  Loader2, 
  Archive,
  Eye,
  Trash2,
  MoreVertical,
  Calendar,
  ChevronRight,
  Calculator,
  Layout
} from "lucide-react"
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/layout/Footer"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { formatArea } from "@/lib/measure-utils"

/**
 * @fileOverview Reports Vault - Professional Tabular Ledger.
 * Restored to a table format for superior management of large-scale estate audits.
 */
export default function ReportsVaultPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isTimedOut, setIsTimedOut] = useState(false)

  const userRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id' ? doc(db, "users", user.uid) : null), [db, user?.uid]);
  const { data: userProfile } = useDoc(userRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  const reportsQuery = useMemo(() => {
    if (!db || !user?.uid || user.uid === 'demo-user-id') return null
    // Explicit sub-collection query
    return query(
      collection(db, "users", user.uid, "siteReports"),
      orderBy("timestamp", "desc")
    )
  }, [db, user?.uid])

  const { data: reports, loading: reportsLoading, error: reportsError } = useCollection(reportsQuery)
  const isActuallyLoading = reportsLoading && !isTimedOut && !reportsError

  const filteredReports = useMemo(() => {
    if (!reports) return []
    if (!searchQuery) return reports
    const q = searchQuery.toLowerCase()
    return reports.filter(r => 
      r.reportTitle?.toLowerCase().includes(q) ||
      r.siteName?.toLowerCase().includes(q)
    )
  }, [reports, searchQuery])

  const handleDeleteReport = async (id: string) => {
    if (!db || !user) return
    if (!confirm("Permanently delete this archived report from your vault?")) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "siteReports", id))
      toast({ title: "Archive Removed", description: "Record deleted from secure storage." })
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Security rule conflict or connection error." })
    }
  }

  const preferredUnit = (userProfile?.preferredAreaUnits?.[0] || 'acres') as any;

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authenticating Vault Access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest px-3">Professional Vault</Badge>
               <span className="text-[10px] font-black uppercase opacity-40">WGS 84 Verified</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight font-headline uppercase text-primary">Reports Ledger</h1>
            <p className="text-muted-foreground font-medium">Archived technical audits and historical estate records.</p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" className="rounded-xl font-bold h-12 shadow-sm" onClick={() => router.push('/audit')}>
                <Calculator className="h-4 w-4 mr-2" /> New Portfolio Audit
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
           <div className="lg:col-span-6 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Filter by report title or site holding..." 
                className="h-14 pl-12 rounded-2xl shadow-xl border-none bg-muted/30 focus-visible:bg-background transition-all" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
           </div>
        </div>
      </header>

      <main className="px-8 pb-24 flex-1">
        {isActuallyLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Synchronizing Vault Database...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="px-8 h-16 font-black uppercase text-[10px] tracking-widest">Audit Title</TableHead>
                  <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Site Holdings</TableHead>
                  <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Components</TableHead>
                  <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Net Area</TableHead>
                  <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Archive Date</TableHead>
                  <TableHead className="px-8 h-16 text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report: any) => (
                  <TableRow 
                    key={report.id} 
                    className="border-muted/50 hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/history/${report.id}`)}
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate uppercase group-hover:text-primary transition-colors">{report.reportTitle}</p>
                          <p className="text-[10px] text-muted-foreground font-bold truncate">Ref: {report.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Landmark className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                         <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[200px]">{report.siteName || "Multiple"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                       <Badge variant="outline" className="font-black text-[9px] uppercase border-muted-foreground/20">
                         {report.auditData?.totalComponents || report.auditData?.siteCount || '1'} Layers
                       </Badge>
                    </TableCell>

                    <TableCell>
                       <span className="text-[11px] font-black text-primary">
                         {report.auditData?.net ? formatArea(report.auditData.net, preferredUnit) : 'N/A'}
                       </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <p className="text-[10px] font-bold">
                          {report.timestamp ? format(new Date(report.timestamp.toDate?.() || report.timestamp), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="px-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                          <DropdownMenuItem className="rounded-xl font-bold h-11" onClick={() => router.push(`/history/${report.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> Inspect Audit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl font-bold h-11 text-destructive" onClick={() => handleDeleteReport(report.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-32 space-y-6">
            <div className="h-32 w-32 bg-muted/20 rounded-[3rem] border-4 border-dashed border-muted flex items-center justify-center text-muted-foreground/30">
              <Archive className="h-14 w-14" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-muted-foreground">Audit Vault Empty</h2>
              <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto">No archived technical reports found. Aggregate your field data in the <strong>Estate Audit</strong> module to create permanent records.</p>
            </div>
            <Button className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-primary/20" onClick={() => router.push('/audit')}>
               Initialize First Audit <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
