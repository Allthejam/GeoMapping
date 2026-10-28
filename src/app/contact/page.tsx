"use client"

import { useState } from "react"
import { useFirestore } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, MessageSquare, Send, CheckCircle2, MapPin, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"

export default function ContactPage() {
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    
    setLoading(true)
    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        senderName: formData.name,
        senderEmail: formData.email,
        status: "new",
        timestamp: serverTimestamp()
      })
      setSubmitted(true)
      toast({
        title: "Message Sent",
        description: "Our support team will review your inquiry shortly."
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please check your connection."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-background overflow-auto flex flex-col">
      <main className="max-w-4xl mx-auto p-6 py-16 md:py-24 space-y-16 w-full">
        
        <section className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter font-headline leading-none">
            Get in <span className="text-primary">Touch.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Have a question about our mapping engine or subscription tiers? Our team of GPS specialists is here to help.
          </p>
        </section>

        {submitted ? (
          <Card className="border-none shadow-2xl rounded-[3rem] bg-muted/30 overflow-hidden text-center py-16 px-8 animate-in zoom-in duration-500">
            <CardContent className="space-y-6">
              <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black font-headline">Survey Received!</h2>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                Thank you for reaching out. A GeoMapping specialist will contact you at <strong>{formData.email}</strong> shortly.
              </p>
              <Button asChild size="lg" className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-xs">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-background overflow-hidden p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest ml-1">Your Name</Label>
                      <Input 
                        id="name" 
                        required 
                        className="h-12 rounded-xl" 
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest ml-1">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        className="h-12 rounded-xl" 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-black uppercase tracking-widest ml-1">Subject</Label>
                    <Input 
                      id="subject" 
                      required 
                      className="h-12 rounded-xl" 
                      placeholder="Pricing Inquiry / Technical Support"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-black uppercase tracking-widest ml-1">Message Content</Label>
                    <Textarea 
                      id="message" 
                      required 
                      className="rounded-xl min-h-[150px] p-4" 
                      placeholder="Tell us about your field requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Transmit Message
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Direct Contact</h3>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-bold">support@geomeasure.app</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Headquarters</p>
                        <p className="text-sm font-bold leading-tight">Precision Mapping Systems<br />Tech Park, London, UK</p>
                      </div>
                   </div>
                </div>
              </div>

              <Card className="border-none bg-muted/30 p-8 rounded-[2rem] space-y-4">
                <h4 className="font-black text-sm uppercase tracking-tight">System Status</h4>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Global Support Live</p>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Our agents are currently processing field inquiries with an average response time of 12 hours.
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
