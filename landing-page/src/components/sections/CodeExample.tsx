import React, { useState } from "react";
import { cn } from "@/lib/utils";
import FadeIn from "../ui-custom/FadeIn";
import Terminal from "../ui-custom/Terminal";

const CodeExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"typescript" | "python">(
    "typescript",
  );

  const typescriptCode = `import { cache } from "rmmbr";

const cacher = cache({
  cacheId: "openai-completions",
  ttl: 60 * 60 * 24, // Values will expire after one day
  token: "YOUR_RMMBR_TOKEN", // Optional - enables cloud persistence
  url: "https://rmmbr.net",
  encryptionKey: "YOUR_ENCRYPTION_KEY", // Optional - enables e2e encryption
});

// Your expensive API call
const generateCompletion = async (prompt: string) => {
  console.log("Calling OpenAI API...");
  ...
  return response.json();
};

// Cached version - will only call the API if not in cache
const cachedGenerateCompletion = cacher(generateCompletion);

// Usage
const result = await cachedGenerateCompletion("Tell me a joke about caching");
console.log(result);

// Subsequent calls with the same prompt will use the cache!
const cachedResult = await cachedGenerateCompletion("Tell me a joke about caching");`;

  const pythonCode = `import asyncio
import openai
import rmmbr

openai.api_key = "YOUR_OPENAI_API_KEY"

@rmmbr.cache(
    "grammar-checks-cache",     # Cache name
    60 * 60 * 24,               # TTL is one day
    "YOUR_ENCRYPTION_KEY",      # Optional encryption key
    "https://rmmbr.net",        # Service URL
    "YOUR_RMMBR_TOKEN",         # Optional - enables cloud persistence
)
async def fix_grammar(sentence: str):
    print("Sending request to OpenAI...")
    return await openai.Completion.acreate(
        model="text-davinci-003",
        prompt="Correct this to standard English:\\n\\n" + sentence,
        temperature=0,
        max_tokens=60,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
    )

async def main():
    # First call - will invoke the API
    result = await fix_grammar("She no went to the market.")
    print(result)
    
    # Second call - will use the cache!
    cached_result = await fix_grammar("She no went to the market.")
    print(cached_result)
    
    # Make sure any pending writes complete before program exit
    await rmmbr.wait_all_writes()

asyncio.run(main())`;

  return (
    <section id="code-examples" className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <FadeIn>
            <h2 className="font-bold text-foreground mb-4">
              Simple Integration
            </h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg text-muted-foreground">
              Just a few lines of code to implement persistent caching in your
              application. No complex setup required.
            </p>
          </FadeIn>
        </div>

        <div className="bg-muted rounded-xl shadow-lg overflow-hidden border border-border max-w-4xl mx-auto">
          <div className="flex border-b border-border">
            <button
              className={cn(
                "py-3 px-6 text-sm font-medium flex-1 transition-colors",
                activeTab === "typescript"
                  ? "bg-card text-rmmbr-400 border-b-2 border-rmmbr-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              onClick={() => setActiveTab("typescript")}
            >
              JavaScript / TypeScript
            </button>
            <button
              className={cn(
                "py-3 px-6 text-sm font-medium flex-1 transition-colors",
                activeTab === "python"
                  ? "bg-card text-rmmbr-400 border-b-2 border-rmmbr-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              onClick={() => setActiveTab("python")}
            >
              Python
            </button>
          </div>

          <div className="p-6">
            {activeTab === "typescript"
              ? (
                <Terminal
                  code={typescriptCode}
                  language="typescript"
                  title="TypeScript Example"
                  showLineNumbers={true}
                />
              )
              : (
                <Terminal
                  code={pythonCode}
                  language="python"
                  title="Python Example"
                  showLineNumbers={true}
                />
              )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <FadeIn>
            <div className="inline-block rounded-lg px-4 py-2 bg-muted text-muted-foreground text-sm mb-2">
              CLI Installation
            </div>
          </FadeIn>
          <FadeIn delay={200}>
            <Terminal
              code="curl -s https://raw.githubusercontent.com/uriva/rmmbr/main/cli/install.sh | sudo bash"
              title="Install rmmbr CLI"
              className="max-w-2xl mx-auto"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default CodeExample;
