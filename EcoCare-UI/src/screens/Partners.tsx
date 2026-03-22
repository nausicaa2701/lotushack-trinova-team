import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ApiError, apiPostJson } from '../lib/apiClient';

const BAY_OPTIONS = ['1-3', '4-8', '8-12', '12+'] as const;

const SERVICE_OPTIONS: Array<{ id: string; label: string; special?: boolean }> = [
  { id: 'exterior', label: 'Exterior' },
  { id: 'interior', label: 'Interior' },
  { id: 'detailing', label: 'Detailing' },
  { id: 'ev-charging', label: 'EV Charging', special: true },
];

export default function Partners() {
  const navigate = useNavigate();
  const [washBays, setWashBays] = React.useState<string>('1-3');
  const [services, setServices] = React.useState<string[]>([]);
  const [businessName, setBusinessName] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [businessAddress, setBusinessAddress] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [businessLicenseNumber, setBusinessLicenseNumber] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [refId, setRefId] = React.useState<string | null>(null);

  const scrollToRegister = () => {
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!businessName.trim() || !contactPerson.trim() || !businessAddress.trim() || !phoneNumber.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    if (services.length === 0) {
      setSubmitError('Select at least one service you offer.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPostJson<{ ok: boolean; id: string; message: string }>('/api/partner-applications', {
        businessName: businessName.trim(),
        contactPerson: contactPerson.trim(),
        businessAddress: businessAddress.trim(),
        phoneNumber: phoneNumber.trim(),
        businessLicenseNumber: businessLicenseNumber.trim(),
        washBays,
        services,
      });
      setSubmitSuccess(true);
      setRefId(res.id);
      setBusinessName('');
      setContactPerson('');
      setBusinessAddress('');
      setPhoneNumber('');
      setBusinessLicenseNumber('');
      setServices([]);
      setWashBays('1-3');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not submit your application. Try again later.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Benefits */}
      <section className="bg-surface-container-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-headline text-3xl font-extrabold">Why Partner with WashNet?</h2>
            <p className="text-on-surface-variant mx-auto max-w-2xl">
              Scale your business with industry-leading tools and a direct line to the world&apos;s fastest-growing vehicle segment.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: 'pi-wallet',
                title: 'Preferred Supply Pricing',
                desc: 'Save up to 20% on premium detailing chemicals and supplies through our exclusive partner network.',
              },
              {
                icon: 'pi-users',
                title: 'Connect with EV Owners',
                desc: 'Instant access to a growing community of high-value electric vehicle owners looking for specialized care.',
              },
              {
                icon: 'pi-chart-bar',
                title: 'Advanced Admin Tools',
                desc: 'Free access to real-time analytics, booking management, and performance tracking to optimize operations.',
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8 }}
                className="group rounded-3xl bg-surface-container-lowest p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  <i className={`pi ${benefit.icon} text-3xl`} />
                </div>
                <h3 className="mb-4 font-headline text-xl font-bold">{benefit.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Solutions */}
      <section className="bg-surface-container-low py-24 px-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <h2 className="mb-4 font-headline text-4xl font-bold">Core Solutions</h2>
            <p className="text-on-surface-variant max-w-2xl">Tailored infrastructure for the future of automotive care.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl bg-surface-container-lowest p-10 md:col-span-2">
              <div className="relative z-10">
                <i className="pi pi-map-marker mb-6 text-4xl text-primary" />
                <h3 className="mb-4 font-headline text-2xl font-bold">Smart Discovery</h3>
                <p className="text-on-surface-variant mb-6 max-w-md">
                  Dynamic mapping that filters for EV-certified wash bays with integrated charging facilities. Locate, book, and pay in one seamless flow.
                </p>
                <Link
                  to="/login"
                  className="group/link flex items-center gap-2 font-bold text-primary transition-all hover:gap-4"
                >
                  Explore the Map <i className="pi pi-arrow-right" />
                </Link>
              </div>
              <div className="absolute bottom-0 right-0 h-full w-1/2 translate-x-10 translate-y-10 -skew-x-12 bg-slate-100/50 transition-transform duration-500 group-hover:translate-y-4">
                <img
                  src="https://images.unsplash.com/photo-1512428559083-a40ce12044a5?q=80&w=2070&auto=format&fit=crop"
                  alt=""
                  className="h-full w-full object-cover opacity-40"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="rounded-xl bg-primary p-10 text-on-primary">
              <i className="pi pi-eye mb-6 text-4xl text-primary-container" />
              <h3 className="mb-4 font-headline text-2xl font-bold">Partner Visibility</h3>
              <p className="mb-8 text-primary-container/90">Boost your brand to high-value EV owners looking for premium care services.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <i className="pi pi-check-circle text-sm" /> Verified EV Badge
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <i className="pi pi-check-circle text-sm" /> Priority Search Placement
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center gap-10 rounded-xl bg-surface-container-lowest p-10 md:col-span-3 md:flex-row">
              <div className="flex-1">
                <i className="pi pi-chart-line mb-6 text-4xl text-tertiary" />
                <h3 className="mb-4 font-headline text-2xl font-bold">Admin Analytics</h3>
                <p className="text-on-surface-variant">
                  Precision dashboard providing real-time fleet wash data, revenue forecasting, and chemical consumption metrics. Full transparency for the modern operator.
                </p>
              </div>
              <div className="flex h-48 w-full flex-1 items-end gap-2 rounded-lg bg-surface-container-low p-6">
                {[40, 60, 90, 55, 75, 45].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-primary-container" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders */}
      <section className="bg-surface py-24 px-6 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-headline text-4xl font-bold">Elevating Every Interaction</h2>
            <p className="text-on-surface-variant">A synchronized platform for three critical stakeholders.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                icon: 'pi-car',
                title: 'EV Owners',
                desc: 'Ensure your vehicle’s sensors and battery cooling systems are handled with precision care in certified bays.',
                features: ['Contactless Payment', 'Smart Scheduling'],
                color: 'bg-primary',
              },
              {
                icon: 'pi-shop',
                title: 'Service Providers',
                desc: 'Capture the growing EV market segment and optimize your operational throughput with digital tools.',
                features: ['Customer CRM', 'Dynamic Pricing'],
                color: 'bg-secondary',
              },
              {
                icon: 'pi-shield',
                title: 'Platform Admins',
                desc: 'Total control over network health, partner vetting, and marketplace stability through a single pane of glass.',
                features: ['Ecosystem Audit', 'Revenue Splitting'],
                color: 'bg-tertiary',
              },
            ].map((group) => (
              <div
                key={group.title}
                className="rounded-xl border border-transparent bg-surface-container p-8 transition-all hover:border-primary/20"
              >
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-full text-on-primary ${group.color}`}
                >
                  <i className={`pi ${group.icon}`} />
                </div>
                <h4 className="mb-3 font-headline text-xl font-bold">{group.title}</h4>
                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">{group.desc}</p>
                <ul className="space-y-3 text-sm font-medium">
                  {group.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <i className="pi pi-bolt text-sm text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 md:px-12">
        <div className="power-gradient relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] p-12 text-center shadow-2xl md:p-20">
          <div className="relative z-10">
            <h2 className="mb-6 font-headline text-4xl font-extrabold text-on-primary md:text-5xl">Join the Future of Auto-Care</h2>
            <p className="text-primary-container mx-auto mb-10 max-w-2xl text-lg">
              Register today to access the world’s first precision car wash platform built specifically for the electric mobility revolution.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                type="button"
                label="Sign Up Now"
                className="rounded-full border-none bg-on-primary px-10 py-4 font-headline text-lg font-bold text-primary hover:bg-surface-container-lowest"
                onClick={() => navigate('/login')}
              />
              <Button
                type="button"
                label="Contact Sales"
                className="rounded-full border border-primary-container/30 bg-transparent px-10 py-4 font-headline text-lg font-bold text-on-primary hover:bg-on-primary/10"
                onClick={scrollToRegister}
              />
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      {/* Application form */}
      <section className="bg-surface py-24" id="register">
        <div className="mx-auto max-w-4xl scroll-mt-28 px-6">
          <div className="rounded-[2.5rem] bg-surface-container-lowest p-8 shadow-sm md:p-12">
            <div className="mb-12">
              <h2 className="mb-2 font-headline text-3xl font-extrabold text-on-surface">Become a Partner</h2>
              <p className="text-on-surface-variant">Fill out the form below and our team will reach out within 48 hours.</p>
            </div>

            {submitSuccess ? (
              <div className="rounded-2xl border border-tertiary/30 bg-tertiary-container/20 p-8 text-center">
                <p className="font-headline text-xl font-bold text-on-surface">Application received</p>
                <p className="mt-2 text-on-surface-variant">
                  Reference: <span className="font-mono font-semibold text-primary">{refId}</span>
                </p>
                <p className="mt-4 text-sm text-slate-600">We&apos;ll contact you within 48 hours.</p>
                <Button
                  type="button"
                  label="Submit another application"
                  className="mt-6 border-none font-bold"
                  text
                  onClick={() => {
                    setSubmitSuccess(false);
                    setRefId(null);
                  }}
                />
              </div>
            ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="biz-name">
                    Business Name *
                  </label>
                  <InputText
                    id="biz-name"
                    value={businessName}
                    onChange={(ev) => setBusinessName(ev.target.value)}
                    placeholder="e.g. Precision Detailing Hub"
                    className="w-full rounded-xl border-none bg-surface-container-highest px-5 py-3 transition-all focus:ring-2 focus:ring-primary"
                    autoComplete="organization"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="contact">
                    Contact Person *
                  </label>
                  <InputText
                    id="contact"
                    value={contactPerson}
                    onChange={(ev) => setContactPerson(ev.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border-none bg-surface-container-highest px-5 py-3 transition-all focus:ring-2 focus:ring-primary"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="address">
                  Business Address *
                </label>
                <InputText
                  id="address"
                  value={businessAddress}
                  onChange={(ev) => setBusinessAddress(ev.target.value)}
                  placeholder="Street Address, City, State, ZIP"
                  className="w-full rounded-xl border-none bg-surface-container-highest px-5 py-3 transition-all focus:ring-2 focus:ring-primary"
                  autoComplete="street-address"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="phone">
                    Phone Number *
                  </label>
                  <InputText
                    id="phone"
                    value={phoneNumber}
                    onChange={(ev) => setPhoneNumber(ev.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border-none bg-surface-container-highest px-5 py-3 transition-all focus:ring-2 focus:ring-primary"
                    autoComplete="tel"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="license">
                    Business License Number
                  </label>
                  <InputText
                    id="license"
                    value={businessLicenseNumber}
                    onChange={(ev) => setBusinessLicenseNumber(ev.target.value)}
                    placeholder="LIC-XXXX-XXXX"
                    className="w-full rounded-xl border-none bg-surface-container-highest px-5 py-3 transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="px-1 text-sm font-semibold text-on-surface-variant">Number of Wash Bays *</span>
                <div className="flex flex-wrap gap-4">
                  {BAY_OPTIONS.map((option) => (
                    <div key={option} className="min-w-[80px] flex-1">
                      <input
                        type="radio"
                        className="sr-only"
                        name="washBays"
                        id={`bay-${option}`}
                        checked={washBays === option}
                        onChange={() => setWashBays(option)}
                      />
                      <label
                        htmlFor={`bay-${option}`}
                        className={`block cursor-pointer rounded-xl p-3 text-center text-sm font-bold transition-all ${
                          washBays === option
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-surface-container-high hover:bg-surface-container-highest'
                        }`}
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="px-1 text-sm font-semibold text-on-surface-variant">Services Offered *</span>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {SERVICE_OPTIONS.map((service) => (
                    <label
                      key={service.id}
                      htmlFor={service.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors ${
                        service.special
                          ? 'border-2 border-tertiary/20'
                          : 'bg-surface-container-high hover:bg-surface-container-highest'
                      }`}
                    >
                      <Checkbox
                        inputId={service.id}
                        checked={services.includes(service.id)}
                        onChange={(e) => {
                          if (e.checked) {
                            if (!services.includes(service.id)) setServices([...services, service.id]);
                          } else {
                            setServices(services.filter((s) => s !== service.id));
                          }
                        }}
                      />
                      <span className={`text-sm font-medium ${service.special ? 'font-bold text-tertiary' : ''}`}>
                        {service.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {submitError ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{submitError}</p>
              ) : null}

              <div className="pt-6">
                <Button
                  type="submit"
                  label={submitting ? 'Submitting…' : 'Submit Application'}
                  disabled={submitting}
                  className="power-gradient w-full rounded-full border-none py-5 font-headline text-lg font-extrabold text-on-primary shadow-xl shadow-primary/20"
                />
                <p className="text-on-surface-variant mt-6 text-center text-xs">
                  By submitting, you agree to our{' '}
                  <a href="/" className="underline">
                    Partner Terms
                  </a>{' '}
                  and{' '}
                  <a href="/" className="underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
