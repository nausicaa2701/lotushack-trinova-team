import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from 'primereact/button';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      
      {/* Hero Section */}
      <section id="features" className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <span className="inline-block px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-sm text-xs font-bold tracking-widest uppercase mb-6">
              Electric Ready
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-headline font-extrabold text-on-surface leading-[1.1] mb-8">
              WashNet - <br/>
              <span className="text-primary italic">Precision Fluidity</span> for the Electric Era
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
              The intelligent ecosystem connecting EV owners, wash partners, and administrators with data-driven tools designed for high-voltage standards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                label="Book Your First Wash" 
                className="power-gradient text-white px-10 py-4 rounded-full font-headline font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/20 border-none"
                onClick={() => navigate('/login')}
              />
              <Link to="/partners">
                <Button
                  label="Partner with Us"
                  className="bg-surface-container-lowest text-primary border border-outline-variant/15 px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-surface-container-low transition-all"
                />
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative z-20">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-IW0yZeX_VLpG4aBlRmDu-8v67hXnrmhRa9Cyt5MFbcwhy074URhpA7oHJ1wHFKsk_hPxFMqtgfm59yj2JT-SgUJAbSwUScf646tTPxaZmcEIIVPjRgi0kAjBLCNLz7frfs18FMc7QW84_JbsLXo7JADZJ0Ozvl60fcsC2al2gP51q5W8X4VVD-rO3yKsqpqcgvHDUd-Mkkg5vBHLACh83gzqTA8PS0ZQOhR_Md1aZUkmB7a5J3GoNwn3O9y7I3G8E6hfuPFNWE5r" 
                alt="Electric car in wash station" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-10 -right-10 w-48 h-48 bg-tertiary-container/20 rounded-xl rotate-12 -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* Core Solutions Section */}
      <section id="partners" className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Core Solutions</h2>
            <p className="text-on-surface-variant max-w-2xl">Tailored infrastructure for the future of automotive care.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Smart Discovery */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-surface-container-lowest p-10 rounded-3xl relative overflow-hidden group"
            >
              <div className="relative z-10">
                <i className="pi pi-map-marker text-primary text-4xl mb-6"></i>
                <h3 className="text-2xl font-headline font-bold mb-4">Smart Discovery</h3>
                <p className="text-on-surface-variant max-w-md mb-6">Dynamic mapping that filters for EV-certified wash bays with integrated charging facilities. Locate, book, and pay in one seamless flow.</p>
                <Link to="/login" className="text-primary font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                  Explore the Map <i className="pi pi-arrow-right"></i>
                </Link>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full bg-slate-100/50 -skew-x-12 translate-x-10 translate-y-10 group-hover:translate-y-4 transition-transform duration-500">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnlzMh4nuhtLSLlilROXOcFGs2ajmxzvQ2jj1DCmxQDnVs1DARfra0eurLSmqZo7yqg_Ga7pIUtosYlqw07f90uCwcja1HjuqasAp2lYNiShOV7u7tFUE3mxEELfkMuzNp-zTfIvgMBCqPD25fMSMFxY6tDC_wjYA7vQQD5IMBJrF0vzHbYlemNDWF0dEpKoQ-5eVJ1Ug9gfypiylqTBgsFYIgcBsCsUcGQMH_GKOeqMno5BN7Ph28S8P3YM7N1WVYqs8slKz-cUsv" 
                  alt="Map interface" 
                  className="opacity-40 object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            {/* Partner Visibility */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-primary p-10 rounded-3xl text-on-primary"
            >
              <i className="pi pi-eye text-primary-container text-4xl mb-6"></i>
              <h3 className="text-2xl font-headline font-bold mb-4 text-white">Partner Visibility</h3>
              <p className="text-primary-container/90 mb-8">Boost your brand to high-value EV owners looking for premium care services.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm"><i className="pi pi-check-circle text-sm"></i> Verified EV Badge</li>
                <li className="flex items-center gap-2 text-sm"><i className="pi pi-check-circle text-sm"></i> Priority Search Placement</li>
              </ul>
            </motion.div>

            {/* Admin Analytics */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-3 bg-surface-container-lowest p-10 rounded-3xl flex flex-col md:flex-row gap-10 items-center"
            >
              <div className="flex-1">
                <i className="pi pi-chart-bar text-tertiary text-4xl mb-6"></i>
                <h3 className="text-2xl font-headline font-bold mb-4">Admin Analytics</h3>
                <p className="text-on-surface-variant">Precision dashboard providing real-time fleet wash data, revenue forecasting, and chemical consumption metrics. Full transparency for the modern operator.</p>
              </div>
              <div className="flex-1 w-full h-48 bg-surface-container-low rounded-2xl p-6 flex items-end gap-2">
                <div className="flex-1 bg-primary-container h-[40%] rounded-sm"></div>
                <div className="flex-1 bg-primary-container h-[60%] rounded-sm"></div>
                <div className="flex-1 bg-primary h-[90%] rounded-sm"></div>
                <div className="flex-1 bg-primary-container h-[55%] rounded-sm"></div>
                <div className="flex-1 bg-primary-container h-[75%] rounded-sm"></div>
                <div className="flex-1 bg-primary-container h-[45%] rounded-sm"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Elevating Every Interaction Section */}
      <section id="about" className="py-24 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Elevating Every Interaction</h2>
            <p className="text-on-surface-variant">A synchronized platform for three critical stakeholders.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* EV Owners */}
            <div className="bg-surface-container p-8 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-on-primary mb-6">
                <i className="pi pi-car"></i>
              </div>
              <h4 className="text-xl font-headline font-bold mb-3">EV Owners</h4>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">Ensure your vehicle’s sensors and battery cooling systems are handled with precision care in certified bays.</p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex gap-3"><i className="pi pi-bolt text-primary text-sm"></i> Contactless Payment</li>
                <li className="flex gap-3"><i className="pi pi-calendar text-primary text-sm"></i> Smart Scheduling</li>
              </ul>
            </div>

            {/* Service Providers */}
            <div className="bg-surface-container p-8 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-on-secondary mb-6">
                <i className="pi pi-shop"></i>
              </div>
              <h4 className="text-xl font-headline font-bold mb-3">Service Providers</h4>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">Capture the growing EV market segment and optimize your operational throughput with digital tools.</p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex gap-3"><i className="pi pi-users text-secondary text-sm"></i> Customer CRM</li>
                <li className="flex gap-3"><i className="pi pi-tag text-secondary text-sm"></i> Dynamic Pricing</li>
              </ul>
            </div>

            {/* Platform Admins */}
            <div className="bg-surface-container p-8 rounded-3xl border border-transparent hover:border-primary/20 transition-all">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center text-on-tertiary mb-6">
                <i className="pi pi-shield"></i>
              </div>
              <h4 className="text-xl font-headline font-bold mb-3">Platform Admins</h4>
              <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">Total control over network health, partner vetting, and marketplace stability through a single pane of glass.</p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex gap-3"><i className="pi pi-search text-tertiary text-sm"></i> Ecosystem Audit</li>
                <li className="flex gap-3"><i className="pi pi-money-bill text-tertiary text-sm"></i> Revenue Splitting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto power-gradient rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-primary mb-6">Join the Future of Auto-Care</h2>
            <p className="text-primary-container text-lg mb-10 max-w-2xl mx-auto">Register today to access the world’s first precision car wash platform built specifically for the electric mobility revolution.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                label="Sign Up Now" 
                className="bg-white text-primary px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-surface-container-lowest transition-all border-none"
                onClick={() => navigate('/login')}
              />
              <Button 
                label="Contact Sales" 
                className="bg-transparent text-white border border-primary-container/30 px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-white/10 transition-all"
                disabled
                tooltip="Planned for post-MVP"
              />
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
