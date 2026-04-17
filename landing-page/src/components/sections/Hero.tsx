import React from "react";
import FadeIn from "../ui-custom/FadeIn";
import Button from "../ui-custom/Button";
import { INSTANTDB_APP_URL } from "@/lib/links";
import { ArrowRight, Database, Lock, Zap } from "lucide-react";
import Terminal from "../ui-custom/Terminal";

const Hero: React.FC = () => {
  const quickCodeExample = `import { cache } from "rmmbr";

const cachedFn = cache(cacheParams)(async (input) => {
  // some expensive api call here...
});`;

  return (
    <div className="relative overflow-hidden pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-rmmbr-900/20 to-transparent -z-10">
      </div>

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.05] -z-10">
        <div className="absolute top-0 left-0 right-0 h-screen bg-[radial-gradient(#2170eb_1px,transparent_1px)] [background-size:32px_32px]">
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto">
          <FadeIn animation="slide-down">
            <div className="inline-block rounded-full px-3 py-1 text-sm font-medium bg-rmmbr-900/30 text-rmmbr-300 mb-6">
              Simplifying Persistent Caching
            </div>
          </FadeIn>

          <FadeIn animation="slide-down" delay={100}>
            <h1 className="font-bold text-foreground mb-4 leading-tight">
              The simplest way to cache your functions
            </h1>
          </FadeIn>

          <FadeIn animation="fade-in" delay={200}>
            <div className="mb-10 max-w-xl mx-auto">
              <Terminal
                code={quickCodeExample}
                language="javascript"
                title="Quick Start"
                showLineNumbers={false}
                className="mx-auto text-left"
                maxHeight="max-h-[100px]"
              />
            </div>
          </FadeIn>

          <FadeIn animation="fade-in" delay={300}>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
              Persistently cache locally or in the cloud with end-to-end
              encryption. No DevOps work, no cloud configurations—it just works.
            </p>
          </FadeIn>

          <FadeIn animation="fade-in" delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 md:mb-16">
              <Button
                href={INSTANTDB_APP_URL}
                size="lg"
                iconPosition="right"
                icon={<ArrowRight size={16} />}
              >
                Get Started
              </Button>
              <Button
                href="https://github.com/uriva/rmmbr"
                variant="outline"
                size="lg"
              >
                View Documentation
              </Button>
            </div>
          </FadeIn>

          <FadeIn animation="fade-in" delay={600}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="bg-muted rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                  <Zap size={20} className="text-rmmbr-400" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  Zero Configuration
                </h3>
                <p className="text-muted-foreground text-sm">
                  Works out of the box without any DevOps setup
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="bg-muted rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-rmmbr-400" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  End-to-End Encryption
                </h3>
                <p className="text-muted-foreground text-sm">
                  Keep your sensitive data securely encrypted
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="bg-muted rounded-lg w-10 h-10 flex items-center justify-center mb-4">
                  <Database size={20} className="text-rmmbr-400" />
                </div>
                <h3 className="font-medium text-foreground mb-1">
                  Multi-Device Cache
                </h3>
                <p className="text-muted-foreground text-sm">
                  Share caches across all your service instances
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Hero;
