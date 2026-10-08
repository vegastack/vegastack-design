"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { LevelMeter } from "@/components/ui/level-meter";
import { Button } from "@/components/ui/button";

// Resting render is deterministic: a fixed level.
export function levelMeter(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <LevelMeter level={0.6} className="w-48" />
      <LevelMeter level={1} className="w-48" aria-label="Clipping level" />
      <LevelMeter
        level={0.6}
        active={false}
        className="w-48"
        aria-label="Paused level"
      />
    </Wrapper>
  );
}

export function levelMeterMicrophone(): ReactNode {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(
    () => () => streamRef.current?.getTracks().forEach((t) => t.stop()),
    [],
  );
  const toggle = async () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      return;
    }
    const next = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = next;
    setStream(next);
  };
  return (
    <Wrapper className="gap-3">
      <Button variant="outline" size="sm" onClick={() => void toggle()}>
        {stream ? "Stop" : "Test microphone"}
      </Button>
      <LevelMeter stream={stream} active={stream != null} className="w-48" />
    </Wrapper>
  );
}
