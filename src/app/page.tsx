import { GainsProvider } from "@/components/providers/GainsProvider";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import HealthStrip from "@/components/sections/HealthStrip";
import ControlPanel from "@/components/sections/ControlPanel";
import Installer from "@/components/sections/Installer";
import Modules from "@/components/sections/Modules";
import Docs from "@/components/sections/Docs";
import Diagnostics from "@/components/sections/Diagnostics";
import LiftLog from "@/components/sections/LiftLog";
import Footer from "@/components/sections/Footer";
import Toaster from "@/components/ui/Toaster";
import Ambient from "@/components/ui/Ambient";

export default function Home() {
  return (
    <GainsProvider>
      <a
        href="#term-input"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
      >
        Skip to terminal
      </a>
      <Nav />
      <main>
        <Hero />
        <HealthStrip />
        <ControlPanel />
        <Installer />
        <Modules />
        <Docs />
        <Diagnostics />
        <LiftLog />
      </main>
      <Footer />
      <Toaster />
      <Ambient />
    </GainsProvider>
  );
}
