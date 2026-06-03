import { useEffect, useRef } from "react";

export default function InteractiveAIOrb() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = canvas.width = 400;
    let height = canvas.height = 400;

    // Handle responsiveness / container size
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        const size = Math.min(canvas.parentElement.clientWidth, 400);
        width = canvas.width = size;
        height = canvas.height = size;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 3D Particles
    const particleCount = 65;
    const particles = [];
    const radius = 130;

    // Generate points on a 3D sphere surface using Fibonacci sphere algorithm
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - 2 * (i / particleCount));
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        baseX: radius * Math.sin(phi) * Math.cos(theta),
        baseY: radius * Math.sin(phi) * Math.sin(theta),
        baseZ: radius * Math.cos(phi),
      });
    }

    // Rotation angles
    let angleX = 0.003;
    let angleY = 0.004;

    // Mouse interaction tracking
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left - width / 2;
      const clientY = e.clientY - rect.top - height / 2;
      mouse.targetX = clientX * 0.0002;
      mouse.targetY = clientY * 0.0002;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth interpolation for mouse movement
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const currentAngleX = angleX + mouse.y;
      const currentAngleY = angleY + mouse.x;

      // Draw glowing background central aura
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.45);
      grad.addColorStop(0, "rgba(20, 110, 255, 0.28)");
      grad.addColorStop(0.3, "rgba(19, 144, 255, 0.08)");
      grad.addColorStop(0.7, "rgba(0, 94, 255, 0.02)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Rotate particles
      const radX = currentAngleX;
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);

      const radY = currentAngleY;
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      // Temporary arrays to store projected 2D coordinates
      const projected = [];

      particles.forEach((p) => {
        // Rotate around Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X axis
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Save rotated coordinates
        p.x = x1;
        p.y = y2;
        p.z = z2;

        // 3D perspective projection
        const scale = 300 / (300 + z2); // Perspective scaling factor
        const projX = width / 2 + x1 * scale;
        const projY = height / 2 + y2 * scale;

        projected.push({
          x: projX,
          y: projY,
          z: z2,
          scale: scale,
        });
      });

      // Draw connecting lines between close neighbors
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect only if they are close on screen & have similar depth
          if (dist < 60) {
            const alpha = (1 - dist / 60) * 0.18;
            ctx.strokeStyle = `rgba(0, 150, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw the neural node points with depth coloring & styling
      projected.forEach((p) => {
        // Front particles are bright blue, back particles are dark and small
        const brightness = Math.max(0.1, (130 - p.z) / 260); 
        ctx.fillStyle = `rgba(19, 144, 255, ${brightness})`;
        ctx.shadowBlur = p.z < 0 ? 10 * p.scale : 0;
        ctx.shadowColor = "#1390ff";

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, 2.5 * p.scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      });

      // Slowly increment base rotation
      angleX = 0.003;
      angleY = 0.004;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-center select-none pointer-events-none relative">
      <canvas 
        ref={canvasRef} 
        className="max-w-full transition-transform duration-300"
        style={{ filter: "drop-shadow(0 0 30px rgba(19, 144, 255, 0.2))" }}
      />
    </div>
  );
}
