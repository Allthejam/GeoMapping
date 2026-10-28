"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  MessageSquare, 
  Mail, 
  Trash2, 
  Eye, 
  Search, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Loader2,
  User,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

export default function AdminMessagesPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  // Verify Admin Status
  const profileRef = useMemo(() => (db && user?.uid && user.uid !== 'demo-user-id') ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)
  
  const isActualAdmin = profile?.role === 'admin' || user?.uid === 'demo-user-id' || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  const isRealAdmin = (profile?.role === 'admin' || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) && user?.uid !== 'demo-user-id'
  const isSyncing = authLoading || profileLoading

  useEffect(() => {
    if (!isSyncing && !isActualAdmin) {
      router.push("/measure")
    }
  }, [isSyncing, isActualAdmin, router])

  // Guard query until sync is complete and real admin status is verified
  const canFetchRealData = isRealAdmin && !isSyncing && !!db;
  const messagesQuery = useMemo(() => (canFetchRealData) ? query(collection(db, "messages"), orderBy("timestamp", "desc")) : null, [db, canFetchRealData])
  const { data: cloudMessages, loading } = useCollection(messagesQuery)

  const messages = useMemo(() => {
    if (user?.uid === 'demo-user-id') {
      return [
        { id: 'm1', senderName: 'Demo User', senderEmail: 'demo@example.com', subject: 'Billing Inquiry', message: 'I have a question about the Estate plan.', status: 'new', timestamp: new Date() }
      ]
    }
    return cloudMessages || []
  }, [cloudMessages, user?.uid])

  const filteredMessages = useMemo(() => {
    if (!messages) return []
    if (!search) return messages
    return messages.filter(m => 
      m.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      m.senderEmail?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase())
    )
  }, [messages, search])

  const handleMarkAsRead = async (messageId: string) => {
    if (!db || user?.uid === 'demo-user-id') return
    const messageRef = doc(db, "messages", messageId)
    await updateDoc(messageRef, { status: "read" })
    toast({ title: "Updated", description: "Message marked as read." })
  }

  const handleDelete = async (messageId: string) => {
    if (!db || user?.uid === 'demo-user-id') {
      toast({ title: "Simulation", description: "Message deletion simulated." })
      return
    }
    if (!confirm("Delete this message?")) return
    const messageRef = doc(db, "messages", messageId)
    await deleteDoc(messageRef)
    toast({ title: "Deleted", description: "Message removed from system." })
    if (selectedMessage?.id === messageId) setSelectedMessage(null)
  }

  const openMessage = (msg: any) => {
    setSelectedMessage(msg)
    if (msg.status === 'new') {
      handleMarkAsRead(msg.id)
    }
  }

  if (isSyncing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isActualAdmin) return null;

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <header className="p-8 pt-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight font-headline">Communications</h1>
            <p className="text-muted-foreground font-medium">Manage incoming field inquiries and support tickets.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black text-xs uppercase tracking-widest">
              {filteredMessages.length} Total Messages
            </Badge>
          </div>
        </div>

        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search by sender, email, or subject..." 
            className="h-14 pl-12 rounded-2xl shadow-xl border-none bg-muted/30 focus-visible:bg-background transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="px-8 pb-20">
        <div className="grid grid-cols-1 gap-4">
          {loading && user?.uid !== 'demo-user-id' ? (
            <div className="text-center py-20 text-muted-foreground font-bold flex flex-col items-center gap-4">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               Synchronizing messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-[2rem] space-y-4">
               <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
               <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Inbox Empty</p>
            </div>
          ) : (
            filteredMessages.map((msg: any) => (
              <Card 
                key={msg.id} 
                className={cn(
                  "border-none shadow-xl rounded-[2rem] group transition-all duration-300 overflow-hidden cursor-pointer",
                  msg.status === 'new' ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/20 hover:bg-muted/30"
                )}
                onClick={() => openMessage(msg)}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                        msg.status === 'new' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <p className="font-black text-lg leading-tight">{msg.senderName}</p>
                           {msg.status === 'new' && <Badge className="h-5 bg-primary font-black text-[8px] uppercase tracking-widest">New</Badge>}
                        </div>
                        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> {msg.senderEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Subject</p>
                      <p className="font-bold truncate max-w-xs">{msg.subject}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Received</p>
                        <p className="text-xs font-bold whitespace-nowrap">
                          {msg.timestamp ? format(new Date(msg.timestamp?.toDate?.() || msg.timestamp), 'MMM d, p') : 'Just now'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl">
                          <DropdownMenuItem className="rounded-xl font-bold h-11" onClick={() => openMessage(msg)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {msg.status === 'new' && (
                            <DropdownMenuItem className="rounded-xl font-bold h-11" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(msg.id); }}>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Mark Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="rounded-xl font-bold h-11 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
             <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                <Clock className="h-3 w-3" /> Received {selectedMessage?.timestamp ? format(new Date(selectedMessage.timestamp?.toDate?.() || selectedMessage.timestamp), 'PPP p') : 'Now'}
             </div>
             <DialogTitle className="text-4xl font-black font-headline tracking-tight">{selectedMessage?.subject}</DialogTitle>
             <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border">
                <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-xs">
                   {selectedMessage?.senderName?.[0] || 'A'}
                </div>
                <div>
                   <p className="font-black text-sm">{selectedMessage?.senderName}</p>
                   <p className="text-xs font-bold text-muted-foreground">{selectedMessage?.senderEmail}</p>
                </div>
             </div>
          </DialogHeader>
          <div className="py-8">
             <div className="bg-background border rounded-3xl p-8 min-h-[200px] shadow-inner font-medium leading-relaxed italic">
                "{selectedMessage?.message}"
             </div>
          </div>
          <div className="flex gap-3">
             <Button className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => window.location.href=`mailto:${selectedMessage?.senderEmail}?subject=Re: ${selectedMessage?.subject}`}>
                Reply via Email <ArrowRight className="ml-2 h-4 w-4" />
             </Button>
             <Button variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-destructive hover:text-destructive px-6" onClick={() => handleDelete(selectedMessage?.id)}>
                <Trash2 className="h-5 w-5" />
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}