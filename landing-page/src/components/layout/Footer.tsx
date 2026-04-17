import React from "react";
import { cn } from "@/lib/utils";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Legal",
      links: [
        {
          label: "Terms of Service",
          href:
            "https://github.com/uriva/rmmbr/blob/main/legal/terms_of_service.md",
        },
        {
          label: "Privacy Policy",
          href:
            "https://github.com/uriva/rmmbr/blob/main/legal/privacy_policy.md",
        },
        {
          label: "Service Level Agreement",
          href:
            "https://github.com/uriva/rmmbr/blob/main/legal/service_level_agreement.md",
        },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 mb-12">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-foreground font-medium mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-rmmbr-400 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-rmmbr-400 font-medium text-xl">rmmbr</span>
          </div>

          <div className="text-muted-foreground text-sm">
            © {currentYear} rmmbr. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
