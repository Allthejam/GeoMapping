"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { useAuth, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Mail, Lock, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * @fileOverview Professional Sign-In Interface.
 * Optimized for secure access control and password recovery.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const auth = useAuth()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/measure")
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)

    if (!auth) {
      setError("Establishing secure connection to authentication gateway...")
      setLoading(false)
      return
    }

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/measure")
    } catch (err: any) {
      setError("Invalid credentials. Please verify your email and password.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your registered email address to receive a recovery link."
      })
      return
    }

    if (!auth) return

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Transmission Initiated",
        description: "If an account with this email address exists in our system, a password reset link will be transmitted shortly. Please check your Spam inbox if you have not received it."
      })
      setError(null)
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "This email address is not registered. Please check the spelling or create a new account."
        })
      } else {
        toast({
          variant: "destructive",
          title: "Recovery Error",
          description: "Could not initiate password reset. Please verify your connection and try again."
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-3 pb-8 text-center bg-muted/20">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="mx-auto h-14 w-14 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4">
              <MapPin className="h-7 w-7 text-white fill-current" />
            </div>
            <CardTitle className="text-3xl font-black font-headline tracking-tighter uppercase">GeoMapping</CardTitle>
          </Link>
          <CardDescription className="text-muted-foreground font-medium">Sign in to manage your professional land records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="agent@geomeasure.app" 
                  className="pl-12 h-14 rounded-2xl border-muted bg-muted/30 focus-visible:bg-background transition-all font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1">Secure Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-12 pr-12 h-14 rounded-2xl border-muted bg-muted/30 focus-visible:bg-background transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(!!checked)} 
                />
                <Label htmlFor="remember" className="text-xs font-bold text-muted-foreground cursor-pointer select-none">
                  Stay signed in
                </Label>
              </div>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline hover:opacity-80 transition-all"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive font-black leading-tight uppercase tracking-tight">{error}</p>
              </div>
            )}
            
            <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authorize Session"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t bg-muted/10 p-8">
          <p className="text-sm text-muted-foreground font-medium">
            New field agent? <Link href="/register" className="text-primary font-black uppercase tracking-widest text-xs ml-2 hover:underline">Create Account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
