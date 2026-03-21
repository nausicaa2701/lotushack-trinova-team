import React from 'react';
import { motion } from 'motion/react';
import { Star, MapPin, ArrowRight, Sparkles, ShieldCheck, Droplets } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const Dashboard = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-12 flex flex-col justify-end min-h-[400px]">
        <img 
          alt="Modern sustainable car wash facility" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwL7BJ6HPCUV0Nk6PqNluIcJ_BiZE0VgfE4UdNdGR0RzxIo2MLSSiUdFfBiF6IGh_EkAx-HDT8YSksFD7kY4dNnmzAUS5EEzOmkQYnXRu1AaJbaYo-UyyDH6I5mUaseeXs35O05TZyh-TiuVsYhvW_BPxiJdMeY7I_cTfN9VNnoihyJwMK9rhUym3rE85hhueLSCf7DlZSYLgkFADGpKC8qd-1Ajk_57q7YO8Ty315z7o-q3qIQ3Hrb7OjQMGAFRByddIXkAQDUGcL"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest mb-4">Sustainability First</span>
          <h2 className="text-5xl font-extrabold text-white font-headline leading-tight mb-6">Find the perfect sustainable shine.</h2>
          <p className="text-lg text-slate-300 font-sans mb-8 max-w-lg">Advanced water filtration and eco-friendly formulas for a showroom finish that respects the planet.</p>
          <div className="flex gap-4">
            <button className="power-gradient text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-transform">Book Now</button>
            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all">View Near Me</button>
          </div>
        </div>
      </section>

      {/* Nearby Stations */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Nearby Stations</h3>
            <p className="text-slate-500 font-medium mt-1">Found 12 premium locations within 5 miles</p>
          </div>
          <button className="text-primary font-bold flex items-center gap-1 group">
            See All 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Station Card 1 */}
          <div className="group bg-surface-container-low rounded-[2rem] p-4 transition-all hover:bg-surface-container-lowest hover:shadow-2xl hover:shadow-on-surface/5">
            <div className="relative rounded-[1.5rem] overflow-hidden aspect-[16/10] mb-6">
              <img 
                alt="AquaStream Pro Station" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP70em0OdztgTZeOFyt_XlWVfx90ZYfPF6-FfIF9bFPXOEgotGj1kzB3x6vanCknCDduEwr9rfDHxwZLvpO5kF6gmSF8ThmGW-1bZcTfYRrqoGr4fanuDiqQd3f-7MZxzmnTwpT8WOPC3kbBsb0DHPof1i0pwmkg4nGz1bFd6wBFR5dA677J_ECfWQzUVROUb4q4Q48z1W8vNzeDSxitOBZVVke9ajVWJwiFvfazVUAel3oXQkVulYkRUij7sGpJjbHZDkGNr6fLyc"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-900">4.9</span>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded-sm uppercase tracking-tighter">EV Specialized</span>
              </div>
            </div>
            <div className="px-2">
              <h4 className="text-xl font-bold font-headline text-on-surface mb-1">AquaStream Pro EV</h4>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-4">
                <MapPin size={14} />
                <span>0.8 miles away • Open until 10 PM</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex -space-x-2">
                  {[1, 2].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-slate-500">+2k</div>
                </div>
                <span className="text-primary font-bold text-sm">View Details</span>
              </div>
            </div>
          </div>

          {/* Station Card 2 */}
          <div className="group bg-surface-container-low rounded-[2rem] p-4 transition-all hover:bg-surface-container-lowest hover:shadow-2xl hover:shadow-on-surface/5">
            <div className="relative rounded-[1.5rem] overflow-hidden aspect-[16/10] mb-6">
              <img 
                alt="EcoShine Hub Station" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB0F1BaSg_6mc3MWf6bz1pIX4Sj4h__NxIj_gD1IHoi7FtYsQZ_J_WL-vcPCswKmY2I1JB3ytKgEWGr4dhnm5zIQE_hnh53A8SxAR4AIY-GH41K19MR5YH5-Kg674Lolpl4FVJyd1N06-S2FyaxtB3-zbEFPdCO_ERDxQIFFIxA29HAuLoh5JLFAfiwWEhUfIqJVEedBD0JpWkoWaVrpSfcovvqRezViVAtbTxKo92BrOXKUA9EfsxAokZJh4fyGuMOEWV5o8NedtJ"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-900">4.7</span>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-sm uppercase tracking-tighter">Eco Friendly</span>
              </div>
            </div>
            <div className="px-2">
              <h4 className="text-xl font-bold font-headline text-on-surface mb-1">EcoShine Hub</h4>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-4">
                <MapPin size={14} />
                <span>1.5 miles away • 24/7 Access</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex -space-x-2">
                   {[3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-slate-500">+800</div>
                </div>
                <span className="text-primary font-bold text-sm">View Details</span>
              </div>
            </div>
          </div>

          {/* Map View Callout */}
          <div className="bg-primary-container rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
            <div>
              <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-widest mb-4 inline-block">Map View</span>
              <h4 className="text-3xl font-extrabold font-headline text-primary leading-tight mb-4">Locate all 34 charge-wash sites.</h4>
              <p className="text-on-secondary-container/80 text-sm font-medium max-w-[180px]">Interactive map with real-time lane occupancy.</p>
            </div>
            <button className="w-fit flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-full font-bold transition-transform hover:scale-105">
              Open Map
              <MapPin size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="pb-20">
        <div className="mb-8">
          <h3 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Featured Services</h3>
          <p className="text-slate-500 font-medium mt-1">Specialized treatments for the meticulous driver</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard 
            icon={Sparkles} 
            title="Premium Polish & Seal" 
            desc="Hydrophobic polymer coating with a 3-stage orbital polish for a mirror finish that lasts 6 months."
            price={89}
            color="primary"
          />
          <ServiceCard 
            icon={ShieldCheck} 
            title="Interior Detail" 
            desc="Steam sanitation of all surfaces, leather conditioning, and deep extraction of upholstery fibers."
            price={120}
            color="tertiary"
          />
          <ServiceCard 
            icon={Droplets} 
            title="Basic Wash" 
            desc="100% recycled water touchless wash with gentle air dry and wheel brightener included."
            price={25}
            color="secondary"
          />
        </div>
      </section>
    </motion.div>
  );
};

const ServiceCard = ({ icon: Icon, title, desc, price, color }: any) => {
  const colorClasses: any = {
    primary: "bg-primary-container/30 text-primary",
    tertiary: "bg-tertiary-container/20 text-tertiary",
    secondary: "bg-secondary-container/30 text-on-secondary-container"
  };

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", colorClasses[color])}>
        <Icon size={32} />
      </div>
      <h5 className="text-xl font-bold font-headline text-on-surface mb-2">{title}</h5>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-extrabold text-on-surface">${price}</span>
        <button className="bg-surface-container-highest hover:bg-primary hover:text-white text-on-surface px-6 py-2 rounded-full font-bold transition-all text-sm">Add</button>
      </div>
    </div>
  );
};
