'use client';

import React, { useEffect, useState, useId, useRef } from 'react';
import { Loader2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PaypalButtonProps {
  planId?: string; // For recurring subscriptions
  amount?: string; // For one-time payments (e.g. "45.00")
  tierName?: string;
  onSuccess?: () => void;
  isSubscription?: boolean;
}

/**
 * @fileOverview Surveyor-Grade PayPal Smart Button Component
 * Handles real-time billing logic for both subscriptions and one-time access.
 */
export function PaypalButton({ 
  planId, 
  amount, 
  tierName = 'pro', 
  onSuccess, 
  isSubscription = true 
}: PaypalButtonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfigurationValid, setIsConfigurationValid] = useState(true);
  const { user } = useUser();
  const db = useFirestore();
  const uniqueId = useId().replace(/:/g, '');
  const containerId = `paypal-button-container-${uniqueId}`;
  const isRendered = useRef(false);

  useEffect(() => {
    // Subscriptions require a valid Plan ID from the dashboard
    if (isSubscription) {
      if (!planId || planId.includes('PLAN-ID') || planId === 'sb') {
        setIsConfigurationValid(false);
      } else {
        setIsConfigurationValid(true);
      }
    } else {
      // One-time payments only need an amount, they are always "valid" config-wise
      setIsConfigurationValid(!!amount);
    }
  }, [planId, amount, isSubscription]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';
    const scriptId = 'paypal-sdk-script-unified';
    
    const loadPaypal = () => {
      if (window.paypal) {
        setIsLoaded(true);
        return;
      }

      if (document.getElementById(scriptId)) {
        const checkInterval = setInterval(() => {
          if (window.paypal) {
            setIsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      // Use 'subscription' intent if any subscription button is on the page
      // but 'capture' is for one-time payments. 'vault=true' is required for subscriptions.
      const intent = 'subscription'; 
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=${intent}`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        console.error("PayPal SDK load failed.");
        toast({ variant: "destructive", title: "Billing System Offline", description: "Could not connect to secure payment gateway." });
      };
      document.body.appendChild(script);
    };

    loadPaypal();
  }, []);

  useEffect(() => {
    if (isLoaded && window.paypal && user && !isRendered.current && isConfigurationValid) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = ''; 
        try {
          // @ts-ignore
          window.paypal.Buttons({
            style: {
              shape: 'pill',
              color: isSubscription ? 'blue' : 'gold',
              layout: 'vertical',
              label: isSubscription ? 'subscribe' : 'buynow'
            },
            createSubscription: isSubscription ? (data: any, actions: any) => {
              return actions.subscription.create({
                plan_id: planId,
                custom_id: user.uid
              });
            } : undefined,
            createOrder: !isSubscription ? (data: any, actions: any) => {
              // Note: When using subscription intent, you can still create orders
              return actions.order.create({
                purchase_units: [{
                  amount: { 
                    currency_code: 'GBP',
                    value: amount || "0.00" 
                  },
                  description: `${tierName.toUpperCase()} - 1 Year Professional Access`,
                  custom_id: user.uid
                }]
              });
            } : undefined,
            onApprove: async (data: any, actions: any) => {
              toast({ title: "Transaction Authorized", description: "Updating your technical entitlements..." });
              
              if (db && user) {
                try {
                  const userRef = doc(db, 'users', user.uid);
                  const updateData: any = {
                    subscriptionStatus: tierName,
                    lastPaymentType: isSubscription ? 'subscription' : 'one-time',
                    lastPaymentDate: new Date().toISOString()
                  };

                  if (isSubscription) {
                    updateData.paypalSubscriptionId = data.subscriptionID;
                  } else {
                    // Capture one-time payment
                    await actions.order.capture();
                    updateData.paypalOrderId = data.orderID;
                    const expiry = new Date();
                    expiry.setFullYear(expiry.getFullYear() + 1);
                    updateData.subscriptionExpiry = expiry.toISOString();
                  }

                  await updateDoc(userRef, updateData);
                  toast({ title: "Account Upgraded", description: `Welcome to GeoMapping ${tierName}.` });
                  if (onSuccess) onSuccess();
                } catch (e) {
                  console.error("Profile sync failed:", e);
                }
              }
            },
            onError: (err: any) => {
              console.error("PayPal Execution Error:", err);
              toast({ 
                variant: "destructive", 
                title: "Gateway Error", 
                description: "The payment could not be processed. Please check your plan configuration." 
              });
            }
          }).render(`#${containerId}`);
          isRendered.current = true;
        } catch (err) {
          console.error("Render failed:", err);
        }
      }
    }
  }, [isLoaded, user, db, planId, amount, isSubscription, onSuccess, containerId, tierName, isConfigurationValid]);

  if (!isConfigurationValid) {
    return (
      <div className="p-8 bg-muted/30 border border-dashed rounded-[2rem] flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
           <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
           <p className="text-xs font-black uppercase tracking-widest text-foreground">Plan Configuration Required</p>
           <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
             The <strong>{tierName.toUpperCase()} Subscription</strong> is not yet linked. Create a plan in your PayPal dashboard and update your .env file.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {!isLoaded && (
        <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-[2rem] animate-pulse border">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Vault...</span>
        </div>
      )}
      <div id={containerId} className="min-h-[100px] pointer-events-auto"></div>
      {isLoaded && (
        <div className="flex items-center justify-center gap-2 opacity-60">
           {isSubscription ? <Zap className="h-3 w-3 text-primary" /> : <ShieldCheck className="h-3 w-3 text-green-600" />}
           <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
             {isSubscription ? "Automated Yearly Renewal" : "Single 12-Month Technical License"}
           </p>
        </div>
      )}
    </div>
  );
}
