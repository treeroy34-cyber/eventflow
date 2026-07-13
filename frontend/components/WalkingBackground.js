'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const WalkingPersonStyles = () => (
    <style>
        {`
            .w-joint { position: absolute; transform-origin: top center; will-change: transform; }
            
            @keyframes thigh-f { 0% { transform: rotate(30deg); } 25% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } 75% { transform: rotate(0deg); } 100% { transform: rotate(30deg); } }
            @keyframes thigh-b { 0% { transform: rotate(-30deg); } 25% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } 75% { transform: rotate(0deg); } 100% { transform: rotate(-30deg); } }
            @keyframes calf-f { 0% { transform: rotate(0deg); } 25% { transform: rotate(45deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(0deg); } 100% { transform: rotate(0deg); } }
            @keyframes calf-b { 0% { transform: rotate(10deg); } 25% { transform: rotate(0deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(45deg); } 100% { transform: rotate(10deg); } }
            @keyframes arm-f { 0% { transform: rotate(-25deg); } 50% { transform: rotate(25deg); } 100% { transform: rotate(-25deg); } }
            @keyframes arm-b { 0% { transform: rotate(25deg); } 50% { transform: rotate(-25deg); } 100% { transform: rotate(25deg); } }
            @keyframes forearm { 0% { transform: rotate(-10deg); } 50% { transform: rotate(-35deg); } 100% { transform: rotate(-10deg); } }
            @keyframes torso-bob { 0% { transform: translateY(0px) rotate(3deg); } 25% { transform: translateY(-5px) rotate(3deg); } 50% { transform: translateY(0px) rotate(3deg); } 75% { transform: translateY(-5px) rotate(3deg); } 100% { transform: translateY(0px) rotate(3deg); } }

            .w-bob { animation: torso-bob var(--dur) infinite linear; position: absolute; bottom: 0; left: 100px; }
            .w-thigh-f { animation: thigh-f var(--dur) infinite linear; }
            .w-thigh-b { animation: thigh-b var(--dur) infinite linear; }
            .w-calf-f { animation: calf-f var(--dur) infinite linear; }
            .w-calf-b { animation: calf-b var(--dur) infinite linear; }
            .w-arm-f { animation: arm-f var(--dur) infinite linear; }
            .w-arm-b { animation: arm-b var(--dur) infinite linear; }
            .w-forearm { animation: forearm var(--dur) infinite linear; }
        `}
    </style>
);

const WalkingPerson = ({
    duration = 1.0,
    scale = 1,
    delay = 0,
    startY = 50,
    endY = 50,
    zIndex = 1,
    direction = 1,
    shirtColor = '#bbf7d0',
    pantColor = '#475569',
    hatColor = '#f472b6',
    shoeColor = '#0f172a',
    skinColor = '#f59e0b'
}) => {
    // 280px is exactly how far the legs stride in one full animation cycle
    const velocity = (280 * scale) / duration;
    const pathLength = 3200;
    const crossScreenTime = pathLength / velocity;

    // Using explicit vw units inside pixels is tricky, so moving thousands of absolute pixels 
    // ensures they completely cross without squishing.
    const startX = direction === 1 ? -600 : 2600;
    const endX = direction === 1 ? 2600 : -600;

    const deltaY = endY - startY;

    return (
        <motion.div
            initial={{ x: startX, y: 0, scaleX: direction * scale, scaleY: scale }}
            animate={{ x: endX, y: `${deltaY}vh`, scaleX: direction * scale, scaleY: scale }}
            transition={{
                duration: crossScreenTime,
                repeat: Infinity,
                ease: "linear",
                delay: delay
            }}
            style={{
                position: 'absolute',
                top: `${startY}vh`,
                left: 0,
                zIndex: zIndex,
                willChange: 'transform' // Let framer motion handle transform completely to fix moonwalk!
            }}
        >
            <div style={{ position: 'relative', width: '200px', height: '300px' }}>
                <div className="w-bob" style={{ '--dur': `${duration}s` }}>
                    {/* BACK ARM */}
                    <div className="w-joint w-arm-b" style={{ top: '-140px', left: '-5px', zIndex: 1 }}>
                        <div style={{ width: '22px', height: '60px', background: skinColor, borderRadius: '11px', transformOrigin: 'top center', filter: 'brightness(0.8)' }}>
                            <div className="w-joint w-forearm" style={{ top: '50px', left: '0' }}>
                                <div style={{ width: '18px', height: '55px', background: skinColor, borderRadius: '9px', filter: 'brightness(0.9)' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* BACK LEG */}
                    <div className="w-joint w-thigh-b" style={{ top: '-50px', left: '-10px', zIndex: 2 }}>
                        <div style={{ width: '28px', height: '70px', background: pantColor, borderRadius: '14px', transformOrigin: 'top center', filter: 'brightness(0.8)' }}>
                            <div className="w-joint w-calf-b" style={{ top: '60px', left: '2px' }}>
                                <div style={{ width: '22px', height: '75px', background: pantColor, borderRadius: '11px', filter: 'brightness(0.7)' }}>
                                    <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '38px', height: '18px', background: shoeColor, borderRadius: '8px 15px 5px 5px' }}>
                                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: '#fff', opacity: 0.2, borderRadius: '0 0 5px 5px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TORSO */}
                    <div style={{ position: 'absolute', top: '-150px', left: '-15px', width: '45px', height: '110px', background: shirtColor, borderRadius: '20px', zIndex: 3 }}>
                        <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '55px', height: '25px', background: shirtColor, borderRadius: '10px' }}></div>
                    </div>

                    {/* HEAD */}
                    <div style={{ position: 'absolute', top: '-195px', left: '-5px', zIndex: 4 }}>
                        <div style={{ width: '18px', height: '25px', background: skinColor, borderRadius: '8px', position: 'absolute', top: '25px', left: '10px', filter: 'brightness(0.9)' }}></div>
                        <div style={{ width: '35px', height: '40px', background: skinColor, borderRadius: '15px 15px 25px 25px', position: 'absolute', top: '-10px', left: '0' }}>
                            <div style={{ width: '40px', height: '20px', background: '#1e293b', position: 'absolute', bottom: '0', left: '-2px', borderRadius: '0 0 20px 20px' }}></div>
                            <div style={{ width: '38px', height: '18px', background: hatColor, position: 'absolute', top: '-5px', left: '-2px', borderRadius: '12px 12px 0 0' }}></div>
                            <div style={{ width: '25px', height: '6px', background: hatColor, position: 'absolute', top: '10px', left: '25px', borderRadius: '0 5px 5px 0' }}></div>
                        </div>
                    </div>

                    {/* FRONT LEG */}
                    <div className="w-joint w-thigh-f" style={{ top: '-45px', left: '5px', zIndex: 5 }}>
                        <div style={{ width: '30px', height: '70px', background: pantColor, borderRadius: '15px', transformOrigin: 'top center' }}>
                            <div className="w-joint w-calf-f" style={{ top: '60px', left: '3px' }}>
                                <div style={{ width: '24px', height: '75px', background: pantColor, borderRadius: '12px', filter: 'brightness(0.85)' }}>
                                    <div style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '40px', height: '20px', background: shoeColor, borderRadius: '8px 18px 5px 5px' }}>
                                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '5px', background: '#fff', opacity: 0.2, borderRadius: '0 0 5px 5px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FRONT ARM */}
                    <div className="w-joint w-arm-f" style={{ top: '-135px', left: '10px', zIndex: 6 }}>
                        <div style={{ width: '24px', height: '60px', background: shirtColor, borderRadius: '12px', transformOrigin: 'top center', filter: 'brightness(0.9)' }}>
                            <div className="w-joint w-forearm" style={{ top: '50px', left: '2px' }}>
                                <div style={{ width: '20px', height: '60px', background: skinColor, borderRadius: '10px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function WalkingBackground() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // Avoid hydration mismatch

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.85 }}>
            <WalkingPersonStyles />

            {/* Very Fast Walkers (Foreground) - Curated for max performance */}
            <WalkingPerson duration={0.95} scale={1.15} delay={0} startY={55} endY={45} zIndex={8} direction={1} shirtColor="#818cf8" pantColor="#1e1b4b" hatColor="#e879f9" skinColor="#fcd34d" />
            <WalkingPerson duration={1.0} scale={1.2} delay={4.5} startY={45} endY={60} zIndex={7} direction={-1} shirtColor="#34d399" pantColor="#065f46" hatColor="#facc15" skinColor="#fb923c" />

            {/* Normal Walkers (Midground) - Curated for max performance */}
            <WalkingPerson duration={1.1} scale={0.9} delay={1.5} startY={35} endY={50} zIndex={6} direction={-1} shirtColor="#a78bfa" pantColor="#312e81" hatColor="#fca5a5" skinColor="#fde047" />
            <WalkingPerson duration={1.15} scale={0.88} delay={6.0} startY={50} endY={30} zIndex={5} direction={1} shirtColor="#6ee7b7" pantColor="#065f46" hatColor="#fcd34d" />

            {/* Leisurely Walkers (Background) - Curated for max performance */}
            <WalkingPerson duration={1.3} scale={0.65} delay={1.0} startY={25} endY={35} zIndex={3} direction={-1} shirtColor="#38bdf8" pantColor="#0c4a6e" hatColor="#f472b6" />
            <WalkingPerson duration={1.35} scale={0.55} delay={5.5} startY={30} endY={20} zIndex={2} direction={1} shirtColor="#fbbf24" pantColor="#713f12" hatColor="#2dd4bf" skinColor="#ea580c" />
            <WalkingPerson duration={1.4} scale={0.5} delay={9.0} startY={15} endY={25} zIndex={1} direction={1} shirtColor="#c084fc" pantColor="#4c1d95" hatColor="#fbbf24" skinColor="#fde047" />
        </div>
    );
}
