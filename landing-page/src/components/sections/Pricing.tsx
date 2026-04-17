
import React from "react";
import { cn } from "@/lib/utils";
import { INSTANTDB_APP_URL } from "@/lib/links";
import FadeIn from "../ui-custom/FadeIn";
import Button from "../ui-custom/Button";
import { Check } from "lucide-react";

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText?: string;
  buttonHref?: string;
  metadata?: {
    requests: string;
    storage: string;
    entrySize: string;
    entries: string;
  };
}

const PricingTier: React.FC<PricingTierProps> = ({
  title,
  price,
  description,
  features,
  highlighted = false,
  buttonText = "Get Started",
  buttonHref,
  metadata,
}) => {
  return (
    <div 
      className={cn(
        "rounded-2xl p-8 h-full flex flex-col",
        highlighted 
          ? "bg-rmmbr-600 text-white shadow-xl border-2 border-rmmbr-500" 
          : "bg-card border border-border"
      )}
    >
      <div className="mb-6">
        <h3 className={cn(
          "text-xl font-medium mb-2",
          highlighted ? "text-white" : "text-foreground"
        )}>
          {title}
        </h3>
        <div className="mb-3">
          <span className={cn(
            "text-3xl font-bold",
            highlighted ? "text-white" : "text-foreground"
          )}>
            {price}
          </span>
          {price !== "Free" && <span className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>/month</span>}
        </div>
        <p className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>
          {description}
        </p>
      </div>

      {metadata && (
        <div className={cn(
          "grid grid-cols-2 gap-4 mb-6 text-sm p-4 rounded-lg",
          highlighted ? "bg-rmmbr-700/50" : "bg-muted"
        )}>
          <div>
            <div className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>Requests</div>
            <div className="font-medium">{metadata.requests}</div>
          </div>
          <div>
            <div className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>Storage</div>
            <div className="font-medium">{metadata.storage}</div>
          </div>
          <div>
            <div className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>Max Entry Size</div>
            <div className="font-medium">{metadata.entrySize}</div>
          </div>
          <div>
            <div className={highlighted ? "text-rmmbr-100" : "text-muted-foreground"}>Entries</div>
            <div className="font-medium">{metadata.entries}</div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <div className={cn(
              "rounded-full p-1 mr-3 flex-shrink-0 mt-0.5",
              highlighted ? "bg-rmmbr-400" : "bg-rmmbr-900/20"
            )}>
              <Check size={12} className={highlighted ? "text-white" : "text-rmmbr-400"} />
            </div>
            <span className={highlighted ? "text-rmmbr-50" : "text-muted-foreground"}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      <Button
        href={buttonHref}
        variant={highlighted ? "secondary" : "primary"}
        className={cn(
          "w-full justify-center",
          highlighted ? "bg-white text-rmmbr-600 hover:bg-gray-100" : ""
        )}
      >
        {buttonText}
      </Button>
    </div>
  );
};

const Pricing: React.FC = () => {
  const tiers = [
    {
      title: "Free Tier",
      price: "Free",
      description: "Perfect for personal projects and experimentation.",
      features: [
        "Local file caching",
        "Cloud persistence",
        "Simple API",
        "End-to-end encryption",
        "Basic support",
        "Python & JavaScript support",
        "CLI tools"
      ],
      metadata: {
        requests: "10,000",
        storage: "10 MB",
        entrySize: "1 KB",
        entries: "1,000",
      },
      buttonHref: INSTANTDB_APP_URL,
    },
    {
      title: "Pro Tier",
      price: "$100",
      description: "For professional projects and small teams.",
      features: [
        "Everything in Free Tier",
        "Priority support",
        "Multiple cache groups",
        "Custom TTL configuration",
        "Enhanced observability"
      ],
      highlighted: true,
      metadata: {
        requests: "1,000,000",
        storage: "1 GB",
        entrySize: "100 KB",
        entries: "Unlimited",
      },
      buttonHref: INSTANTDB_APP_URL,
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large-scale applications and organizations.",
      features: [
        "Everything in Pro Tier",
        "Custom deployment options",
        "Dedicated infrastructure",
        "SLA guarantees",
        "24/7 support",
        "Account management",
        "Custom integrations"
      ],
      buttonText: "Contact Sales",
      metadata: {
        requests: "Custom",
        storage: "Custom",
        entrySize: "Custom",
        entries: "Unlimited",
      }
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <h2 className="font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-muted-foreground">
              Choose the plan that works best for your needs.
              All plans include core rmmbr functionality.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <FadeIn key={tier.title} delay={index * 100}>
              <PricingTier {...tier} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="mt-16 bg-card rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium text-foreground mb-4">Need a custom solution?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We offer custom plans for specific requirements. Contact our sales team
              to discuss your needs and get a tailored solution.
            </p>
            <Button variant="outline">
              Contact Sales
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Pricing;
