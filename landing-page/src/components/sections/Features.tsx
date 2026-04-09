
import React from "react";
import { cn } from "@/lib/utils";
import FadeIn from "../ui-custom/FadeIn";
import { Cloud, Clock, Shield, Cpu, HardDrive, Globe, Zap, Save, Github } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, className }) => {
  return (
    <div className={cn("bg-card rounded-xl p-6 shadow-sm border border-border h-full", className)}>
      <div className="bg-muted rounded-lg w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-foreground text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <Cloud size={24} className="text-rmmbr-400" />,
      title: "Cloud Persistence",
      description: "Cache your data across servers and devices with automatic cloud synchronization."
    },
    {
      icon: <Shield size={24} className="text-rmmbr-400" />,
      title: "End-to-End Encryption",
      description: "Keep sensitive data secure with optional e2e encryption for all cached data."
    },
    {
      icon: <Cpu size={24} className="text-rmmbr-400" />,
      title: "Language Support",
      description: "Utilize rmmbr in both Python and JavaScript/TypeScript environments."
    },
    {
      icon: <Clock size={24} className="text-rmmbr-400" />,
      title: "Configurable TTL",
      description: "Set custom time-to-live for cached data to control freshness and storage."
    },
    {
      icon: <HardDrive size={24} className="text-rmmbr-400" />,
      title: "Local Fallback",
      description: "Automatically falls back to local file caching when offline or without tokens."
    },
    {
      icon: <Zap size={24} className="text-rmmbr-400" />,
      title: "Zero DevOps",
      description: "No servers to deploy, databases to manage, or infrastructure to maintain."
    },
    {
      icon: <Save size={24} className="text-rmmbr-400" />,
      title: "Cost Efficient",
      description: "Save money on API calls by caching expensive external service responses."
    },
    {
      icon: <Github size={24} className="text-rmmbr-400" />,
      title: "Open Source",
      description: "Completely open source and free to use, modify, and contribute to the project."
    },
  ];

  return (
    <section id="features" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <FadeIn>
            <h2 className="font-bold text-foreground mb-4">
              Why Choose rmmbr?
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-muted-foreground">
              Built to solve real-world caching problems without the overhead
              of complex infrastructure.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 100}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
