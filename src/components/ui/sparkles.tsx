import { useId } from "react";
import { Particles, ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

interface SparklesProps {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: Record<string, unknown>;
}

// Inner component that renders only after the engine is loaded
function SparklesInner({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  options = {},
}: SparklesProps) {
  const { loaded } = useParticlesProvider();
  const id = useId();

  const defaultOptions = {
    background: {
      color: {
        value: background,
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 1,
    },
    fpsLimit: 120,
    particles: {
      color: {
        value: color,
      },
      move: {
        enable: true,
        direction: "none" as const,
        speed: {
          min: minSpeed || speed / 10,
          max: speed,
        },
        straight: false,
      },
      number: {
        value: density,
      },
      opacity: {
        value: {
          min: minOpacity || opacity / 10,
          max: opacity,
        },
        animation: {
          enable: true,
          sync: false,
          speed: opacitySpeed,
        },
      },
      size: {
        value: {
          min: minSize || size / 2.5,
          max: size,
        },
      },
    },
    detectRetina: true,
  };

  if (!loaded) return null;

  return <Particles id={id} options={{ ...defaultOptions, ...options }} className={className} />;
}

// Public component that wraps with ParticlesProvider
export function Sparkles(props: SparklesProps) {
  return (
    <ParticlesProvider init={async (engine: Engine) => { await loadSlim(engine); }}>
      <SparklesInner {...props} />
    </ParticlesProvider>
  );
}
