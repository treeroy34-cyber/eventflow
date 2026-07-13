'use client';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

export default function ScrollZoom({ children, style = {}, scaleRange = [0.85, 1, 1, 0.85] }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Smooth the scroll progress with a spring for a luxurious, fluid velocity
    const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100 });
    
    // Map scroll progress to scale: 
    // - Enters screen: starts at scaleRange[0] (e.g. 0.85)
    // - Reaches viewport active area: scales up to 1.0 (fully zoomed in)
    // - Leaves viewport active area: scales down to scaleRange[3] (e.g. 0.85)
    const scale = useTransform(smoothProgress, [0, 0.35, 0.65, 1], scaleRange);
    
    // Add matching smooth opacity fade transitions
    const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

    return (
        <motion.div
            ref={ref}
            style={{
                ...style,
                scale,
                opacity,
            }}
        >
            {children}
        </motion.div>
    );
}
