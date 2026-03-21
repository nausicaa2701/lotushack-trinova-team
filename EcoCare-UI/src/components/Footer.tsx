export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/15 bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full gap-6 max-w-7xl mx-auto">
        <div className="font-headline font-bold text-on-surface">
          WashNet
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#" className="font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors">Privacy Policy</a>
          <a href="#" className="font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors">Terms of Service</a>
          <a href="#" className="font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors">Partner Agreement</a>
          <a href="#" className="font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors">Contact Us</a>
          <a href="#" className="font-sans text-xs text-on-surface-variant hover:text-on-surface transition-colors">Fleet Solutions</a>
        </div>
        <div className="font-sans text-xs text-on-surface-variant">
          © 2024 WashNet Kinetic Sanctuary. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
