"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "@/lib/pitch";
import { getAudioContext } from "@/lib/audio";

export type TunerStatus = "idle" | "starting" | "running" | "denied" | "error";

export interface TunerReading {
  frequency: number;
  clarity: number;
}

const BUFFER_SIZE = 4096;
const DETECT_INTERVAL_MS = 50;
const HOLD_MS = 750; // keep showing the last reading briefly after the note dies
const MEDIAN_WINDOW = 5;

export function useTuner() {
  const [status, setStatus] = useState<TunerStatus>("idle");
  const [reading, setReading] = useState<TunerReading | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const recentRef = useRef<number[]>([]);
  const lastSeenRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recentRef.current = [];
    setReading(null);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const ac = getAudioContext();
      const source = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      source.connect(analyser);

      streamRef.current = stream;
      sourceRef.current = source;
      analyserRef.current = analyser;

      const buf = new Float32Array(BUFFER_SIZE);
      timerRef.current = window.setInterval(() => {
        const a = analyserRef.current;
        if (!a) return;
        a.getFloatTimeDomainData(buf);
        const result = detectPitch(buf, ac.sampleRate);
        const now = performance.now();
        if (result) {
          lastSeenRef.current = now;
          const recent = recentRef.current;
          recent.push(result.frequency);
          if (recent.length > MEDIAN_WINDOW) recent.shift();
          const sorted = [...recent].sort((x, y) => x - y);
          const median = sorted[Math.floor(sorted.length / 2)];
          setReading({ frequency: median, clarity: result.clarity });
        } else if (now - lastSeenRef.current > HOLD_MS) {
          recentRef.current = [];
          setReading(null);
        }
      }, DETECT_INTERVAL_MS);

      setStatus("running");
    } catch (err) {
      stop();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { status, reading, start, stop };
}
