
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Search, 
  MoreVertical, 
  Mail, 
  Shield, 
  User as UserIcon, 
  Briefcase, 
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Star,
  Eye,
  Zap,
  Calendar,
  Clock,
  AlertTriangle,
  MapPin,
  CreditCard,
  CheckCircle2,
  Activity
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, updateDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { format, isPast, formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

export default function UserManagementPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // 1. Verify Admin Status
  const profileRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  
  const isSyncing = authLoading || profileLoading

  const isActualAdmin = useMemo(() => {
    if (isSyncing) return false;
    if (user?.uid === 'demo-user-id') return true;
    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) return true;
    return profile?.role === 'admin';
  }, [isSyncing, user, profile]);

  const isRealAdmin = useMemo(() => {
    return isActualAdmin && user?.uid !== 'demo-user-id';
  }, [isActualAdmin, user?.uid]);

  // 2. Technical "Settle" State - Forced delay to allow Rules context to stabilize
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

  // Guard query until sync is complete and identity is fully settled in the rule engine
  const canFetchRealData = isRealAdmin && isPermissionReady && !isSyncing && !!db && !!user && !!user.email;
  const usersQuery = useMemo(() => (canFetchRealData) ? query(collection(db, "users"), orderBy("createdAt", "desc")) : null, [db, canFetchRealData])
  const { data: cloudUsers, loading } = useCollection(usersQuery)

  const users = useMemo(() => {
    if (user?.uid === 'demo-user-id') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      return [
        { 
          id: 'd1', 
          displayName: 'Demo Agent', 
          email: 'agent@example.com', 
          role: 'user', 
          usageType: 'professional', 
          subscriptionStatus: 'pro',
          lastPaymentType: 'subscription',
          createdAt: new Date(2023, 10, 5).toISOString(),
          subscriptionExpiry: null,
          industry: 'Land Surveying',
          baseLocation: 'London, UK',
          bio: 'Professional surveyor specializing in large estate perimeters.'
        },
        { 
          id: 'd2', 
          displayName: 'Test Pilot', 
          email: 'test@example.com', 
          role: 'user', 
          usageType: 'personal', 
          isFreeAccount: true, 
          subscriptionStatus: 'estate',
          createdAt: new Date(2024, 1, 12).toISOString(),
          subscriptionExpiry: nextYear.toISOString(),
          industry: 'Agriculture',
          baseLocation: 'Bristol, UK',
          bio: 'Testing hierarchical mapping for small farm plots.'
        },
        { 
          id: 'd3', 
          displayName: 'Expiring User', 
          email: 'expiring@example.com', 
          role: 'user', 
          usageType: 'professional', 
          subscriptionStatus: 'pro',
          lastPaymentType: 'one-time',
          createdAt: new Date(2023, 5, 20).toISOString(),
          subscriptionExpiry: tomorrow.toISOString(),
          industry: 'Real Estate',
          baseLocation: 'Manchester, UK'
        }
      ]
    }
    return cloudUsers || []
  }, [cloudUsers, user?.uid])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (!search) return users
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const handleToggleFullAccess = (userId: string, currentStatus: boolean) => {
    if (!db || user?.uid === 'demo-user-id') {
      toast({ title: "Simulation Mode", description: "Identity updates are simulated." })
      return
    }

    const userRef = doc(db, "users", userId)
    const newStatus = !currentStatus
    
    updateDoc(userRef, { isFreeAccount: newStatus })
      .then(() => {
        toast({
          title: newStatus ? "Full Access Granted" : "Access Restricted",
          description: newStatus 
            ? "Agent now has unrestricted platform access." 
            : "Agent returned to standard subscription constraints."
        })
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, isFreeAccount: newStatus });
        }
      })
      .catch(async (e) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { isFreeAccount: newStatus }
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const getPlanDisplay = (u: any) => {
    if (!u) return null;
    
    if (u.isFreeAccount) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black text-[9px] uppercase px-2 py-0.5">
          <Star className="h-2.5 w-2.5 mr-1 fill-current" /> Admin Override
        </Badge>
      )
    }
    
    switch(u.subscriptionStatus) {
      case 'pro':
        return <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase px-2 py-0.5">Professional</Badge>
      case 'estate':
        return <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[9px] uppercase px-2 py-0.5">Estate Manager</Badge>
      default:
        return <Badge variant="outline" className="text-muted-foreground font-black text-[9px] uppercase px-2 py-0.5">Field Explorer</Badge>
    }
  }

  const getBillingDisplay = (u: any) => {
    if (!u) return null;
    if (u.subscriptionStatus === 'free' && !u.isFreeAccount) return <span className="text-[10px] font-bold text-muted-foreground opacity-40">N/A</span>;
    
    const isSub = u.lastPaymentType === 'subscription';
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {isSub ? <Zap className="h-3 w-3 text-primary" /> : <ShieldCheck className="h-3 w-3 text-green-600" />}
          <span className="text-[10px] font-black uppercase tracking-tight">{isSub ? 'Subscription' : 'One-Time'}</span>
        </div>
      </div>
    )
  }

  if (isSyncing || !isPermissionReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Agent Directory...</p>
        </div>
      </div>
    )
  }

  if (!isActualAdmin) return null;

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-headline">User Directory</h1>
            <p className="text-muted-foreground font-medium">Monitor and manage access for all field agents.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black text-xs uppercase tracking-widest">
              {filteredUsers.length} Total Agents
            </Badge>
          </div>
        </div>

        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search agents by name or email..." 
            className="h-14 pl-12 rounded-2xl shadow-xl border-none bg-muted/30 focus-visible:bg-background transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="px-8 pb-20">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <TableHead className="px-8 h-16 font-black uppercase text-[10px] tracking-widest">Agent Identity</TableHead>
                <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Technical Plan</TableHead>
                <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Billing Model</TableHead>
                <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Usage Type</TableHead>
                <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Joined</TableHead>
                <TableHead className="px-8 h-16 text-right font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && user?.uid !== 'demo-user-id' ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-bold">Synchronizing directory...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-bold">No agents found matching your query.</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem: any) => {
                  return (
                    <TableRow 
                      key={userItem.id} 
                      className="border-muted/50 hover:bg-muted/10 transition-colors cursor-pointer group"
                      onClick={() => setSelectedUser(userItem)}
                    >
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-border shadow-sm">
                             <AvatarImage src={userItem.photoURL} />
                             <AvatarFallback className="font-black text-xs bg-primary/10 text-primary">
                                {userItem.displayName?.[0] || userItem.email?.[0]?.toUpperCase()}
                             </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-black text-sm truncate group-hover:text-primary transition-colors">{userItem.displayName || "Unknown Agent"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" /> {userItem.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getPlanDisplay(userItem)}
                      </TableCell>

                      <TableCell>
                        {getBillingDisplay(userItem)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userItem.usageType === 'professional' ? <Briefcase className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-[10px] font-black uppercase tracking-tight">{userItem.usageType || 'Personal'}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="text-[10px] font-bold">
                          {userItem.createdAt ? format(new Date(userItem.createdAt), 'MMM d, yy') : 'N/A'}
                        </p>
                      </TableCell>

                      <TableCell className="px-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl">
                            <DropdownMenuItem className="rounded-xl font-bold h-11 focus:bg-primary/10 focus:text-primary" onClick={() => setSelectedUser(userItem)}>
                              <Eye className="h-4 w-4 mr-2" /> Inspect Account
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold h-11 focus:bg-primary/10 focus:text-primary" onClick={() => window.location.href=`mailto:${userItem.email}`}>
                              <Mail className="h-4 w-4 mr-2" /> Message Agent
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="rounded-xl font-bold h-11 focus:bg-primary/10 focus:text-primary"
                              onClick={() => handleToggleFullAccess(userItem.id, !!userItem.isFreeAccount)}
                            >
                              {userItem.isFreeAccount ? (
                                <><ShieldAlert className="h-4 w-4 mr-2" /> Revoke Full Access</>
                              ) : (
                                <><ShieldCheck className="h-4 w-4 mr-2" /> Grant Full Access</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-xl font-bold h-11 text-destructive focus:bg-destructive/10">
                              Suspend Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="rounded-[2.5rem] p-0 max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-background">
          {selectedUser && (
            <>
              <div className="relative h-40 bg-muted">
                {selectedUser.backdropURL ? (
                    <img src={selectedUser.backdropURL} className="h-full w-full object-cover opacity-50" />
                ) : (
                    <div className="absolute inset-0 bg-secondary flex items-center justify-center opacity-10">
                      <Users className="h-20 w-20 text-white" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute -bottom-10 left-10">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-2xl">
                      <AvatarImage src={selectedUser.photoURL} />
                      <AvatarFallback className="text-2xl font-black bg-primary text-white rounded-xl">
                          {selectedUser.displayName?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                </div>
              </div>

              <div className="p-10 pt-16 space-y-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black font-headline tracking-tighter">{selectedUser.displayName || 'Unknown Agent'}</h2>
                      <p className="text-muted-foreground font-bold flex items-center gap-2">
                          <Mail className="h-4 w-4" /> {selectedUser.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getPlanDisplay(selectedUser)}
                      <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 border-muted-foreground/30">
                          ID: {selectedUser.id?.slice(0, 8)}
                      </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-none bg-muted/30 p-5 rounded-2xl space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Joined</p>
                      <p className="text-sm font-black flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </Card>
                    <Card className="border-none bg-muted/30 p-5 rounded-2xl space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Access Level</p>
                      <p className="text-sm font-black flex items-center gap-2 uppercase tracking-tight">
                          <Shield className="h-4 w-4 text-primary" />
                          {selectedUser.role || 'User'}
                      </p>
                    </Card>
                    <Card className="border-none bg-muted/30 p-5 rounded-2xl space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Billing End</p>
                      <p className={cn(
                        "text-sm font-black flex items-center gap-2",
                        selectedUser.subscriptionExpiry && isPast(new Date(selectedUser.subscriptionExpiry)) ? "text-red-600" : "text-foreground"
                      )}>
                          <Clock className="h-4 w-4" />
                          {selectedUser.subscriptionExpiry ? format(new Date(selectedUser.subscriptionExpiry), 'MMM d, yy') : (selectedUser.subscriptionStatus === 'free' ? 'No Expiry' : 'Auto-Renew')}
                      </p>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> Professional Context
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-3xl border border-black/5">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Industry Specialist</p>
                            <p className="font-bold text-sm">{selectedUser.industry || 'General Mapping'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Home Base</p>
                            <p className="font-bold text-sm flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 opacity-50" /> {selectedUser.baseLocation?.split('(')[0] || 'Remote Agent'}
                            </p>
                          </div>
                      </div>
                    </div>

                    {selectedUser.bio && (
                      <div className="space-y-3">
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Professional Summary
                          </h3>
                          <div className="bg-background border rounded-3xl p-6 shadow-inner italic font-medium text-sm leading-relaxed text-muted-foreground">
                            "{selectedUser.bio}"
                          </div>
                      </div>
                    )}
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row gap-3 pb-10">
                    <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl" onClick={() => window.location.href=`mailto:${selectedUser.email}`}>
                      <Mail className="h-4 w-4 mr-2" /> Contact Agent
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2",
                        selectedUser.isFreeAccount ? "border-red-200 text-red-600 hover:bg-red-50" : "border-primary/20 text-primary"
                      )}
                      onClick={() => handleToggleFullAccess(selectedUser.id, !!selectedUser.isFreeAccount)}
                    >
                      {selectedUser.isFreeAccount ? (
                          <><ShieldAlert className="h-4 w-4" /> Revoke Admin Access</>
                      ) : (
                          <><ShieldCheck className="h-4 w-4" /> Grant Full Access</>
                      )}
                    </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
