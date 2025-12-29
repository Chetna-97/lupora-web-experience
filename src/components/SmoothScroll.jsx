import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  const scrollingContainerRef = useRef();

  useEffect(() => {
    const skewSetter = gsap.quickSetter(".skewElem", "skewY", "deg");
    const proxy = { skew: 0 };

    ScrollTrigger.create({
      onUpdate: (self) => {
        let skew = self.getVelocity() / -300;
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0,
            duration: 0.8,
            ease: "power3",
            overwrite: true,
            onUpdate: () => skewSetter(proxy.skew)
          });
        }
      }
    });

    // Clean up
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <div ref={scrollingContainerRef} className="smooth-content">
      {children}
    </div>
  );
}