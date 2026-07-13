'use client';
import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        const vertexShaderSource = `
            attribute vec2 position;
            varying vec2 v_texCoord;
            void main() {
                v_texCoord = position * 0.5 + 0.5;
                v_texCoord.y = 1.0 - v_texCoord.y;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            varying vec2 v_texCoord;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
                for (int i = 0; i < 5; i++) {
                    v += a * noise(p);
                    p = m * p;
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                vec2 uv = v_texCoord;
                vec2 mouse = u_mouse / u_resolution;
                
                // Reactivity: Distort UV based on mouse proximity
                float dist = distance(uv, mouse);
                vec2 distortedUV = uv + (uv - mouse) * exp(-dist * 4.0) * 0.05;
                
                // Cyber-Premium Red & Pink Palette (no cyan/blue)
                vec3 obsidian = vec3(0.04, 0.04, 0.06); 
                vec3 red = vec3(0.6, 0.05, 0.18); 
                vec3 pink = vec3(0.9, 0.15, 0.35);
                
                float n1 = fbm(distortedUV * 3.5 + u_time * 0.15);
                float n2 = fbm(distortedUV * 2.5 - u_time * 0.1 + n1 * 1.5);
                
                vec3 color = mix(obsidian, red, n2 * 0.8);
                color = mix(color, pink, pow(n1, 3.0) * 0.4);
                color += pink * (smoothstep(0.45, 1.0, n2) * 0.15); // Glowing highlights
                
                // Horizontal scanlines matching the screenshot pattern
                float scanline = sin(uv.y * 650.0) * 0.04;
                color -= scanline;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const program = gl.createProgram();
        gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
        gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, 'u_time');
        const resLoc = gl.getUniformLocation(program, 'u_resolution');
        const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

        let mouseX = 0, mouseY = 0;
        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId;
        const render = (time) => {
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }

            gl.uniform1f(timeLoc, time * 0.001);
            gl.uniform2f(resLoc, canvas.width, canvas.height);
            gl.uniform2f(mouseLoc, mouseX, mouseY);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
            gl.deleteBuffer(positionBuffer);
            gl.deleteProgram(program);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -20,
                pointerEvents: 'none',
            }}
        />
    );
}
