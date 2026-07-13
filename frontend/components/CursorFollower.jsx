'use client';
import { useEffect, useRef, useState } from 'react';

export default function CursorFollower() {
    const auraRef = useRef(null);
    
    const mouse = useRef({ x: -100, y: -100 });
    const auraPos = useRef({ x: -100, y: -100 });
    
    const [hovered, setHovered] = useState(false);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            setHidden(false);
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            if (
                target.closest('a') || 
                target.closest('button') || 
                target.closest('.card') || 
                target.closest('.glass-interactive') || 
                target.closest('select') || 
                target.closest('input')
            ) {
                setHovered(true);
            } else {
                setHovered(false);
            }
        };

        const handleMouseLeave = () => {
            setHidden(true);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseleave', handleMouseLeave);

        // Smooth spring physics loop
        let animationFrameId;
        const tick = () => {
            // Easing factor for organic trailing inertia
            const auraEase = 0.15;
            auraPos.current.x += (mouse.current.x - auraPos.current.x) * auraEase;
            auraPos.current.y += (mouse.current.y - auraPos.current.y) * auraEase;

            if (auraRef.current) {
                auraRef.current.style.left = `${auraPos.current.x}px`;
                auraRef.current.style.top = `${auraPos.current.y}px`;
            }

            animationFrameId = requestAnimationFrame(tick);
        };

        tick();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (hidden) return null;

    return (
        <>
            {/* Soft White Torch Glow */}
            <div
                ref={auraRef}
                style={{
                    position: 'fixed',
                    width: hovered ? '600px' : '400px',
                    height: hovered ? '600px' : '400px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transition: 'width 0.3s ease, height 0.3s ease',
                    mixBlendMode: 'screen'
                }}
            />
        </>
    );
}
