// Ilustración isométrica decorativa del panel de autenticación.
// Es puramente visual: no aporta información, por eso va aria-hidden.
const COS = Math.sqrt(3) / 2;
const SIN = 0.5;
const OX = 155;
const OY = 150;

type Point = readonly [number, number, number];

function project([x, y, z]: Point): string {
  const screenX = OX + (x - y) * COS;
  const screenY = OY + (x + y) * SIN - z;
  return `${screenX.toFixed(1)},${screenY.toFixed(1)}`;
}

function pointsOf(list: Point[]): string {
  return list.map(project).join(' ');
}

// Rectángulo sobre una cara frontal (plano y = constante).
function front(y: number, x1: number, x2: number, z1: number, z2: number): Point[] {
  return [[x1, y, z1], [x2, y, z1], [x2, y, z2], [x1, y, z2]];
}

interface IsoBoxProps {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  top: string;
  front: string;
  side: string;
}

function IsoBox({ x, y, z, w, d, h, top, front: frontFill, side }: IsoBoxProps) {
  return (
    <>
      <polygon points={pointsOf([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={top} />
      <polygon points={pointsOf([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={frontFill} />
      <polygon points={pointsOf([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={side} />
    </>
  );
}

export default function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 420 300"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sombra de piso y brillo suave de fondo */}
      <ellipse cx="210" cy="252" rx="152" ry="26" fill="#0f172a" opacity="0.05" />
      <ellipse cx="260" cy="180" rx="82" ry="86" fill="#1d4ed8" opacity="0.06" />

      {/* Rack principal: bandejas apiladas + LEDs */}
      <IsoBox x={0} y={0} z={0} w={42} d={42} h={96} top="#334155" front="#1e293b" side="#0f172a" />
      {[12, 28, 44, 60, 76].map((z) => (
        <polygon key={`tray-a-${z}`} points={pointsOf(front(42, 4, 38, z, z + 2.4))} fill="#334155" opacity="0.85" />
      ))}
      {[17, 33, 49, 65, 81].map((z) => (
        <circle key={`led-a-${z}`} {...dot(34, 42, z)} r="2" fill={z % 2 === 0 ? '#60a5fa' : '#93c5fd'} />
      ))}

      {/* Rack secundario, más alto */}
      <IsoBox x={48} y={0} z={0} w={42} d={42} h={122} top="#334155" front="#1e293b" side="#0f172a" />
      {[14, 34, 54, 74, 94, 108].map((z) => (
        <polygon key={`tray-b-${z}`} points={pointsOf(front(42, 52, 86, z, z + 2.4))} fill="#334155" opacity="0.85" />
      ))}
      {[20, 40, 60, 80, 100, 114].map((z) => (
        <circle key={`led-b-${z}`} {...dot(82, 42, z)} r="2" fill={z % 2 === 0 ? '#93c5fd' : '#60a5fa'} />
      ))}

      {/* Patas del monitor, dibujadas antes del marco para que este las tape */}
      <IsoBox x={126} y={4} z={0} w={34} d={16} h={5} top="#e2e8f0" front="#cbd5e1" side="#cbd5e1" />
      <IsoBox x={137} y={8} z={5} w={12} d={8} h={11} top="#e2e8f0" front="#cbd5e1" side="#cbd5e1" />

      {/* Monitor/terminal: marco claro y fino con pantalla oscura dominante */}
      <IsoBox x={100} y={8} z={16} w={78} d={16} h={64} top="#f8fafc" front="#e2e8f0" side="#cbd5e1" />
      <polygon points={pointsOf(front(24, 106, 172, 22, 74))} fill="#0f172a" />
      <polygon points={pointsOf(front(24, 106, 172, 71, 74))} fill="#1e293b" opacity="0.85" />

      {/* Líneas de código (rects finos, ancho variable) */}
      <polygon points={pointsOf(front(24, 112, 148, 66, 68))} fill="#93c5fd" />
      <polygon points={pointsOf(front(24, 112, 138, 60, 62))} fill="#60a5fa" />
      <polygon points={pointsOf(front(24, 118, 156, 54, 56))} fill="#1d4ed8" />
      <polygon points={pointsOf(front(24, 112, 130, 48, 50))} fill="#93c5fd" />
      <polygon points={pointsOf(front(24, 118, 146, 42, 44))} fill="#60a5fa" />
      <polygon points={pointsOf(front(24, 118, 136, 36, 38))} fill="#1d4ed8" />
      <polygon points={pointsOf(front(24, 112, 142, 30, 32))} fill="#93c5fd" />
      <polygon points={pointsOf(front(24, 112, 118, 24, 27))} fill="#93c5fd" />
      {/* Cursor de la terminal */}
      <polygon points={pointsOf(front(24, 150, 154, 66, 69))} fill="#e2e8f0" />
    </svg>
  );
}

// Ubica un LED sobre la cara frontal antes de proyectarlo.
function dot(x: number, y: number, z: number) {
  const [cx, cy] = project([x, y, z]).split(',');
  return { cx, cy };
}
