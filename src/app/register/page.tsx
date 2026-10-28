"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { initializeFirebase } from "@/firebase/init"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Mail, Lock, User, AlertTriangle, Eye, EyeOff, Loader2, Briefcase } from "lucide-react"

const MASTER_ADMIN_EMAIL = "allan_jamieson@outlook.com";

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [usageType, setUsageType] = useState<"personal" | "professional">("personal")
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/measure")
    }
  }, [user, authLoading, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const activeAuth = auth || initializeFirebase().auth
    const activeDb = db || initializeFirebase().firestore

    if (!activeAuth || !activeDb) {
      setError("Unable to connect to registration services. Please check your network and refresh.")
      return
    }

    if (!agreedToTerms) {
      setError("Agreement to professional terms is required.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passcodes do not match.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(activeAuth, email, password)
      const user = userCredential.user
      
      await updateProfile(user, { displayName: name })
      
      const role = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

      await setDoc(doc(activeDb, "users", user.uid), {
        displayName: name,
        email: email,
        role: role,
        usageType: usageType,
        createdAt: new Date().toISOString()
      })
      
      router.push("/measure")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Credential verification failed.")
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
    <div className="min-h-screen flex items-center justify-center bg-background p-6 py-12">
      <Card className="w-full max-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-2 pb-6 text-center">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <div className="mx-auto h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
              <MapPin className="h-6 w-6 text-white fill-current" />
            </div>
            <CardTitle className="text-3xl font-black font-headline tracking-tight">GeoMapping</CardTitle>
          </Link>
          <CardDescription className="text-muted-foreground font-medium">Join GeoMapping and start mapping today.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  className="pl-10 h-11 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Usage Type</Label>
              <Select value={usageType} onValueChange={(v: any) => setUsageType(v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select usage intent" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="personal">Personal / Hobbyist</SelectItem>
                  <SelectItem value="professional">Professional / Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10 h-11 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-10 pr-10 h-11 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bold">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-10 h-11 rounded-xl"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms} 
                onCheckedChange={(checked) => setAgreedToTerms(!!checked)} 
              />
              <Label 
                htmlFor="terms" 
                className="text-xs font-medium leading-tight text-muted-foreground cursor-pointer"
              >
                I agree to the Terms and Conditions
              </Label>
            </div>

            {error && (
              <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-bold leading-tight">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl font-bold font-headline mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t bg-muted/20 p-6">
          <p className="text-sm text-muted-foreground font-medium">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
