import { motion } from 'motion/react';
import type { FormEvent } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <main className="flex min-h-screen min-h-dvh bg-surface overflow-hidden">
      {/* Left Side: Login Form */}
      <section className="flex flex-col w-full lg:w-1/2 px-6 pb-16 pt-24 sm:px-8 md:px-12 lg:px-20 lg:py-20 justify-center bg-surface-bright relative z-10">
        {/* Brand Logo */}
        <div className="absolute top-8 left-6 sm:left-8 md:left-12 lg:top-12 lg:left-20">
          <Link to="/" className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">
            WashConnect
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Welcome back</h1>
            <p className="text-on-surface-variant font-medium">Access your premium EV wash dashboard.</p>
          </div>

          {/* Auth Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <div className="relative">
                  <i className="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-outline"></i>
                  <InputText 
                    id="email" 
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all duration-200 outline-none" 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                  <Link to="/" className="text-xs font-bold text-primary hover:underline">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <i className="pi pi-lock absolute left-4 top-1/2 -translate-y-1/2 text-outline"></i>
                  <Password 
                    id="password" 
                    toggleMask 
                    feedback={false}
                    className="w-full [&_.p-password-input]:w-full [&_.p-inputtext]:w-full"
                    inputClassName="w-full pl-12 pr-12 py-3.5 bg-surface-container-highest border-none rounded-xl focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all duration-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button className="w-full py-4 px-6 power-gradient text-white font-headline font-bold rounded-full hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20" type="submit">
              Login to Dashboard
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-outline text-xs font-bold tracking-widest uppercase">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low rounded-full border border-outline-variant/10 hover:bg-surface-container-high transition-colors font-semibold text-sm">
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5" 
                referrerPolicy="no-referrer"
              />
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 text-white rounded-full hover:opacity-90 transition-colors font-semibold text-sm">
              <i className="pi pi-apple text-xl"></i>
              Apple
            </button>
          </div>

          {/* Footer Switch */}
          <p className="text-center text-on-surface-variant text-sm font-medium">
            Don't have an account? 
            <Link to="/" className="text-primary font-bold hover:underline ml-1">Sign Up</Link>
          </p>
        </div>

        {/* Bottom Legal */}
        <div className="absolute bottom-6 left-0 hidden w-full text-center lg:block">
          <p className="text-[10px] uppercase tracking-widest text-outline font-bold">Precision Fluidity © 2024 WashConnect</p>
        </div>
      </section>

      {/* Right Side: Brand Imagery */}
      <section className="hidden lg:flex w-1/2 relative bg-surface-container overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern high-end electric vehicle" 
          className="absolute inset-0 w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-20 w-full text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="backdrop-blur-xl bg-white/10 p-10 rounded-3xl border border-white/10 space-y-6 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-sm text-on-tertiary-fixed text-[10px] font-bold tracking-widest uppercase">
              <i className="pi pi-bolt text-xs"></i>
              Premium Performance
            </div>
            <h2 className="font-headline text-4xl font-extrabold leading-tight">Your car deserves the sanctuary of a precise clean.</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <i className="pi pi-leaf"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sustainable Engineering</h3>
                  <p className="text-white/70 text-sm">90% less water usage than traditional bay washes with zero-waste filtration.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <i className="pi pi-calendar"></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Predictive Scheduling</h3>
                  <p className="text-white/70 text-sm">Our AI monitors your local weather and driving habits to suggest the perfect wash time.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Asymmetric Floating Element */}
        <motion.div 
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: 12 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute top-12 right-12 w-32 h-32 backdrop-blur-md bg-white/5 border border-white/10 rounded-full flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-3xl font-black text-white">4.9</div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/60">User Rating</div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
