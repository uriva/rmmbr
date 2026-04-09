import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Button from "../ui-custom/Button";
import { Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Code Examples", href: "#code-examples" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 z-10">
          <span className="text-rmmbr-400 font-medium text-xl md:text-2xl">
            rmmbr
          </span>
        </a>

        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-rmmbr-400 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-3">
            <Button
              href="https://github.com/uriva/rmmbr"
              variant="outline"
              size="sm"
            >
              GitHub
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>

        <button
          className="md:hidden z-10 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>

        {/* Mobile menu */}
        <div
          className={cn(
            "fixed inset-0 bg-background z-0 flex flex-col pt-24 px-6 transition-transform duration-300 ease-in-out md:hidden",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <nav className="flex flex-col space-y-6 mb-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-rmmbr-400 text-lg font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col space-y-4">
            <Button variant="outline" fullWidth>
              Documentation
            </Button>
            <Button fullWidth>Get Started</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
