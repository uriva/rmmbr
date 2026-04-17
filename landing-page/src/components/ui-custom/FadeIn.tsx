import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  animation?: "fade-in" | "slide-up" | "slide-down";
  threshold?: number;
  once?: boolean;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className,
  delay = 0,
  duration = 500,
  animation = "fade-in",
  threshold = 0.1,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px",
      },
    );

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once, threshold]);

  const animationStyles = {
    opacity: 0,
    transform: animation === "slide-up"
      ? "translateY(20px)"
      : animation === "slide-down"
      ? "translateY(-20px)"
      : "translateY(0)",
    transition:
      `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
    transitionDelay: `${delay}ms`,
  };

  const visibleStyles = {
    opacity: 1,
    transform: "translateY(0)",
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        ...animationStyles,
        ...(isVisible ? visibleStyles : {}),
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
