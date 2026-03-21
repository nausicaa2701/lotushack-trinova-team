import { motion } from 'motion/react';
import Navbar from '../../EcoCare-UI/src/components/Navbar';
import Footer from '../../EcoCare-UI/src/components/Footer';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Checkbox } from 'primereact/checkbox';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [washBays, setWashBays] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);

  const onServiceChange = (e: any) => {
    let _services = [...services];
    if (e.checked) _services.push(e.value);
    else _services.splice(_services.indexOf(e.value), 1);
    setServices(_services);
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      
      <main className="pt-20 sm:pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:py-32">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-tertiary-fixed text-on-tertiary-fixed rounded-sm">Partner Program</span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold font-headline tracking-tighter text-on-surface mb-6 leading-[1.1]">
                Join the Future of <span className="text-primary">EV Care</span>
              </h1>
              <p className="text-lg lg:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Empowering wash centers with advanced technology and a premium EV customer base.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="power-gradient text-on-primary px-8 py-4 rounded-full font-headline font-bold text-lg shadow-xl shadow-primary/25 hover:opacity-90 transition-all flex items-center gap-2">
                  Start Your Application
                  <i className="pi pi-arrow-right"></i>
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl"></div>
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl md:rotate-2">
                <img 
                  className="w-full h-[340px] sm:h-[420px] lg:h-[500px] object-cover" 
                  src="https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=2070&auto=format&fit=crop" 
                  alt="Modern high-tech electric vehicle charging and wash station" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              {/* Floating Bento Elements */}
              <div className="absolute top-10 -left-10 glass-card p-6 rounded-2xl shadow-xl max-w-[200px] hidden md:block">
                <div className="flex items-center gap-3 mb-2">
                  <i className="pi pi-car text-tertiary"></i>
                  <span className="text-xs font-bold font-headline uppercase tracking-wider text-on-surface-variant">Active Users</span>
                </div>
                <div className="text-2xl font-bold font-headline">12.5k+</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold font-headline mb-4">Why Partner with WashConnect?</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Scale your business with industry-leading tools and a direct line to the world's fastest-growing vehicle segment.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: 'pi-wallet', title: 'Preferred Supply Pricing', desc: 'Save up to 20% on premium detailing chemicals and supplies through our exclusive partner network.' },
                { icon: 'pi-users', title: 'Connect with EV Owners', desc: 'Instant access to a growing community of high-value electric vehicle owners looking for specialized care.' },
                { icon: 'pi-chart-bar', title: 'Advanced Admin Tools', desc: 'Free access to real-time analytics, booking management, and performance tracking to optimize operations.' }
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -8 }}
                  className="bg-surface-container-lowest p-8 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <i className={`pi ${benefit.icon} text-3xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold font-headline mb-4">{benefit.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Solutions Section */}
        <section id="solutions" className="py-24 px-6 md:px-12 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4">Core Solutions</h2>
              <p className="text-on-surface-variant max-w-2xl">Tailored infrastructure for the future of automotive care.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Smart Discovery */}
              <div className="md:col-span-2 bg-surface-container-lowest p-10 rounded-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <i className="pi pi-map-marker text-primary text-4xl mb-6"></i>
                  <h3 className="text-2xl font-headline font-bold mb-4">Smart Discovery</h3>
                  <p className="text-on-surface-variant max-w-md mb-6">Dynamic mapping that filters for EV-certified wash bays with integrated charging facilities. Locate, book, and pay in one seamless flow.</p>
                  <Link className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all" to="/explore">
                    Explore the Map <i className="pi pi-arrow-right"></i>
                  </Link>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full bg-slate-100/50 -skew-x-12 translate-x-10 translate-y-10 group-hover:translate-y-4 transition-transform duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1512428559083-a40ce12044a5?q=80&w=2070&auto=format&fit=crop" 
                    alt="Map interface" 
                    className="opacity-40 object-cover w-full h-full" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              
              {/* Partner Visibility */}
              <div className="bg-primary p-10 rounded-xl text-on-primary">
                <i className="pi pi-eye text-primary-container text-4xl mb-6"></i>
                <h3 className="text-2xl font-headline font-bold mb-4">Partner Visibility</h3>
                <p className="text-primary-container/90 mb-8">Boost your brand to high-value EV owners looking for premium care services.</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm"><i className="pi pi-check-circle text-sm"></i> Verified EV Badge</li>
                  <li className="flex items-center gap-2 text-sm"><i className="pi pi-check-circle text-sm"></i> Priority Search Placement</li>
                </ul>
              </div>
              
              {/* Admin Analytics */}
              <div className="md:col-span-3 bg-surface-container-lowest p-10 rounded-xl flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1">
                  <i className="pi pi-chart-line text-tertiary text-4xl mb-6"></i>
                  <h3 className="text-2xl font-headline font-bold mb-4">Admin Analytics</h3>
                  <p className="text-on-surface-variant">Precision dashboard providing real-time fleet wash data, revenue forecasting, and chemical consumption metrics. Full transparency for the modern operator.</p>
                </div>
                <div className="flex-1 w-full h-48 bg-surface-container-low rounded-lg p-6 flex items-end gap-2">
                  <div className="flex-1 bg-primary-container h-[40%] rounded-sm"></div>
                  <div className="flex-1 bg-primary-container h-[60%] rounded-sm"></div>
                  <div className="flex-1 bg-primary h-[90%] rounded-sm"></div>
                  <div className="flex-1 bg-primary-container h-[55%] rounded-sm"></div>
                  <div className="flex-1 bg-primary-container h-[75%] rounded-sm"></div>
                  <div className="flex-1 bg-primary-container h-[45%] rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Elevating Every Interaction Section */}
        <section className="py-24 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4">Elevating Every Interaction</h2>
              <p className="text-on-surface-variant">A synchronized platform for three critical stakeholders.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { icon: 'pi-car', title: 'EV Owners', desc: 'Ensure your vehicle’s sensors and battery cooling systems are handled with precision care in certified bays.', features: ['Contactless Payment', 'Smart Scheduling'], color: 'bg-primary' },
                { icon: 'pi-shop', title: 'Service Providers', desc: 'Capture the growing EV market segment and optimize your operational throughput with digital tools.', features: ['Customer CRM', 'Dynamic Pricing'], color: 'bg-secondary' },
                { icon: 'pi-shield', title: 'Platform Admins', desc: 'Total control over network health, partner vetting, and marketplace stability through a single pane of glass.', features: ['Ecosystem Audit', 'Revenue Splitting'], color: 'bg-tertiary' }
              ].map((group, i) => (
                <div key={i} className="bg-surface-container p-8 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                  <div className={`w-12 h-12 ${group.color} rounded-full flex items-center justify-center text-on-primary mb-6`}>
                    <i className={`pi ${group.icon}`}></i>
                  </div>
                  <h4 className="text-xl font-headline font-bold mb-3">{group.title}</h4>
                  <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">{group.desc}</p>
                  <ul className="space-y-3 text-sm font-medium">
                    {group.features.map((f, j) => (
                      <li key={j} className="flex gap-3"><i className="pi pi-bolt text-primary text-sm"></i> {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto power-gradient rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-primary mb-6">Join the Future of Auto-Care</h2>
              <p className="text-primary-container text-lg mb-10 max-w-2xl mx-auto">Register today to access the world’s first precision car wash platform built specifically for the electric mobility revolution.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/login" className="bg-on-primary text-primary px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-surface-container-lowest transition-all">
                  Sign Up Now
                </Link>
                <button className="bg-transparent text-on-primary border border-primary-container/30 px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-on-primary/10 transition-all">
                  Contact Sales
                </button>
              </div>
            </div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Registration Form Section */}
        <section className="py-24 bg-surface" id="register">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-surface-container-lowest rounded-[2rem] md:rounded-[2.5rem] shadow-sm p-6 sm:p-8 md:p-12">
              <div className="mb-12">
                <h2 className="text-3xl font-extrabold font-headline mb-2 text-on-surface">Become a Partner</h2>
                <p className="text-on-surface-variant">Fill out the form below and our team will reach out within 48 hours.</p>
              </div>
              
              <form className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-on-surface-variant px-1">Business Name</label>
                    <InputText placeholder="e.g. Precision Detailing Hub" className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-on-surface-variant px-1">Contact Person</label>
                    <InputText placeholder="Full Name" className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface-variant px-1">Business Address</label>
                  <InputText placeholder="Street Address, City, State, ZIP" className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-primary transition-all" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-on-surface-variant px-1">Phone Number</label>
                    <InputText placeholder="+1 (555) 000-0000" className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-on-surface-variant px-1">Business License Number</label>
                    <InputText placeholder="LIC-XXXX-XXXX" className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-primary transition-all" />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-on-surface-variant px-1">Number of Wash Bays</label>
                  <div className="flex flex-wrap gap-4">
                    {['1-3', '4-8', '8-12', '12+'].map((option) => (
                      <div key={option} className="flex-1 min-w-[110px]">
                        <RadioButton 
                          inputId={`bay-${option}`} 
                          name="washBays" 
                          value={option} 
                          onChange={(e) => setWashBays(e.value)} 
                          checked={washBays === option} 
                          className="hidden"
                        />
                        <label 
                          htmlFor={`bay-${option}`} 
                          className={`block text-center p-3 rounded-xl cursor-pointer font-bold transition-all ${washBays === option ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high'}`}
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-semibold text-on-surface-variant px-1">Services Offered</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'exterior', label: 'Exterior' },
                      { id: 'interior', label: 'Interior' },
                      { id: 'detailing', label: 'Detailing' },
                      { id: 'ev-charging', label: 'EV Charging', special: true }
                    ].map((service) => (
                      <div key={service.id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors ${service.special ? 'bg-tertiary/5 border-2 border-tertiary/20' : 'bg-surface-container-high hover:bg-surface-container-highest'}`}>
                        <Checkbox 
                          inputId={service.id} 
                          name="services" 
                          value={service.id} 
                          onChange={onServiceChange} 
                          checked={services.includes(service.id)} 
                        />
                        <label htmlFor={service.id} className={`text-sm font-medium cursor-pointer ${service.special ? 'font-bold text-tertiary' : ''}`}>
                          {service.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-6">
                  <button type="button" className="w-full power-gradient text-on-primary font-headline font-extrabold py-5 rounded-full text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all">
                    Submit Application
                  </button>
                  <p className="text-center text-xs text-on-surface-variant mt-6">
                    By submitting, you agree to our <a href="#" className="underline">Partner Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
