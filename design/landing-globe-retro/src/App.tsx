import { useEffect, useRef } from "react";

type Point3D = {
  x: number;
  y: number;
  z: number;
};

const globePoints: Point3D[] = Array.from({ length: 950 }, (_, index) => {
  const y = 1 - (index / 949) * 2;
  const radius = Math.sqrt(1 - y * y);
  const angle = Math.PI * (3 - Math.sqrt(5)) * index;

  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
  };
});

const destinations = [
  { name: "JAKARTA", lat: -6.2, lon: 106.8 },
  { name: "TOKYO", lat: 35.7, lon: 139.7 },
  { name: "DUBAI", lat: 25.2, lon: 55.3 },
  { name: "LONDON", lat: 51.5, lon: -0.1 },
  { name: "NEW YORK", lat: 40.7, lon: -74 },
  { name: "CAPE TOWN", lat: -33.9, lon: 18.4 },
  { name: "SYDNEY", lat: -33.9, lon: 151.2 },
];

const toSpherePoint = (lat: number, lon: number): Point3D => {
  const latitude = (lat * Math.PI) / 180;
  const longitude = (lon * Math.PI) / 180;
  return {
    x: Math.cos(latitude) * Math.cos(longitude),
    y: -Math.sin(latitude),
    z: Math.cos(latitude) * Math.sin(longitude),
  };
};

const createArc = (from: Point3D, to: Point3D, liftAmount: number, steps = 42) => {
  const dot = Math.max(-1, Math.min(1, from.x * to.x + from.y * to.y + from.z * to.z));
  const angle = Math.acos(dot);
  const sinAngle = Math.sin(angle);

  return Array.from({ length: steps }, (_, index) => {
    const progress = index / (steps - 1);
    if (sinAngle < 0.001) return from;
    const a = Math.sin((1 - progress) * angle) / sinAngle;
    const b = Math.sin(progress * angle) / sinAngle;
    const lift = 1 + Math.sin(progress * Math.PI) * liftAmount;
    return {
      x: (from.x * a + to.x * b) * lift,
      y: (from.y * a + to.y * b) * lift,
      z: (from.z * a + to.z * b) * lift,
    };
  });
};

const destinationPoints = destinations.map((destination) => ({
  ...destination,
  point: toSpherePoint(destination.lat, destination.lon),
}));

const createRoutes = (pairs: string[][], lift: number) =>
  pairs.map(([from, to]) => {
    const start = destinationPoints.find((destination) => destination.name === from)!;
    const end = destinationPoints.find((destination) => destination.name === to)!;
    return createArc(start.point, end.point, lift);
  });

const airRoutes = createRoutes(
  [
    ["JAKARTA", "TOKYO"],
    ["DUBAI", "LONDON"],
    ["LONDON", "NEW YORK"],
  ],
  0.065,
);

const seaRoutes = createRoutes(
  [
    ["JAKARTA", "DUBAI"],
    ["CAPE TOWN", "DUBAI"],
    ["TOKYO", "SYDNEY"],
  ],
  0.018,
);

const sampleRoute = (route: Point3D[], progress: number) => {
  const scaledProgress = progress * (route.length - 1);
  const index = Math.min(route.length - 2, Math.floor(scaledProgress));
  const blend = scaledProgress - index;
  const current = route[index];
  const next = route[index + 1];
  return {
    x: current.x + (next.x - current.x) * blend,
    y: current.y + (next.y - current.y) * blend,
    z: current.z + (next.z - current.z) * blend,
  };
};

const terminalFade = (progress: number) => {
  const edgeOpacity = Math.min(1, progress / 0.1, (1 - progress) / 0.1);
  return edgeOpacity * edgeOpacity * (3 - 2 * edgeOpacity);
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

function CloudField() {
  return (
    <div className="cloud-field" aria-hidden="true">
      <svg className="cloud cloud-one" viewBox="0 0 120 48">
        <path d="M10 37h94c5 0 8-3 8-7s-4-7-9-7c-2-9-9-15-18-15-7 0-13 4-16 10-3-4-8-7-14-7-9 0-16 7-17 16-3-3-7-5-12-5-8 0-15 5-16 15Z" />
      </svg>
      <svg className="cloud cloud-two" viewBox="0 0 120 48">
        <path d="M10 37h94c5 0 8-3 8-7s-4-7-9-7c-2-9-9-15-18-15-7 0-13 4-16 10-3-4-8-7-14-7-9 0-16 7-17 16-3-3-7-5-12-5-8 0-15 5-16 15Z" />
      </svg>
      <svg className="cloud cloud-three" viewBox="0 0 120 48">
        <path d="M10 37h94c5 0 8-3 8-7s-4-7-9-7c-2-9-9-15-18-15-7 0-13 4-16 10-3-4-8-7-14-7-9 0-16 7-17 16-3-3-7-5-12-5-8 0-15 5-16 15Z" />
      </svg>
      <svg className="cloud cloud-four" viewBox="0 0 120 48">
        <path d="M10 37h94c5 0 8-3 8-7s-4-7-9-7c-2-9-9-15-18-15-7 0-13 4-16 10-3-4-8-7-14-7-9 0-16 7-17 16-3-3-7-5-12-5-8 0-15 5-16 15Z" />
      </svg>
    </div>
  );
}

function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let size = 0;
    let startTime: number | null = null;
    let pointerX = 0;
    let pointerY = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      size = bounds.width;
      canvas.width = bounds.width * pixelRatio;
      canvas.height = bounds.height * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      pointerX += (pointerRef.current.x - pointerX) * 0.045;
      pointerY += (pointerRef.current.y - pointerY) * 0.045;
      context.clearRect(0, 0, size, size);
      const radius = size * 0.42;
      const center = size / 2;
      const rotationY = (reducedMotion ? 0.45 : elapsed * 0.126) + pointerX * 0.24;
      const rotationX = -0.18 + pointerY * 0.12;
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      const project = (point: Point3D) => {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y2 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        return { x: x1, y: y2, z: z2 };
      };

      const projected = globePoints.map(project);

      projected.sort((a, b) => a.z - b.z);
      projected.forEach((point) => {
        const depth = (point.z + 1) / 2;
        const dotRadius = 0.45 + depth * 1.25;
        context.beginPath();
        context.arc(
          center + point.x * radius,
          center + point.y * radius,
          dotRadius,
          0,
          Math.PI * 2,
        );
        context.fillStyle = `rgba(18, 18, 16, ${0.1 + depth * 0.72})`;
        context.fill();
      });

      const drawRouteGroup = (
        routes: Point3D[][],
        dashPattern: number[],
        lineWidth: number,
        opacity: number,
      ) => {
        context.save();
        context.setLineDash(dashPattern);
        context.lineWidth = lineWidth;
        routes.forEach((route) => {
          const routePoints = route.map(project);
          context.beginPath();
          let drawing = false;
          routePoints.forEach((point) => {
            if (point.z > 0.02) {
              const x = center + point.x * radius;
              const y = center + point.y * radius;
              if (!drawing) context.moveTo(x, y);
              else context.lineTo(x, y);
              drawing = true;
            } else {
              drawing = false;
            }
          });
          context.strokeStyle = `rgba(18, 18, 16, ${opacity})`;
          context.stroke();
        });
        context.restore();
      };

      drawRouteGroup(airRoutes, [5, 5], 0.9, 0.52);
      drawRouteGroup(seaRoutes, [1, 3], 1.4, 0.72);

      destinationPoints.forEach((destination) => {
        const point = project(destination.point);
        if (point.z < 0.12) return;
        const x = center + point.x * radius;
        const y = center + point.y * radius;

        context.beginPath();
        context.arc(x, y, 3.2, 0, Math.PI * 2);
        context.fillStyle = "#f4f3ee";
        context.fill();
        context.strokeStyle = "rgba(18, 18, 16, 0.9)";
        context.lineWidth = 1;
        context.stroke();

        if (point.z > 0.42 && size > 500) {
          context.font = '500 8px "DM Mono", monospace';
          context.fillStyle = "rgba(18, 18, 16, 0.78)";
          context.fillText(destination.name, x + 7, y - 7);
        }
      });

      const planeDurations = [15, 18, 21];
      const planeOffsets = [0.16, 0.48, 0.76];
      airRoutes.forEach((route, planeIndex) => {
        const routeProgress = reducedMotion
          ? 0.28 + planeIndex * 0.2
          : (elapsed / planeDurations[planeIndex] + planeOffsets[planeIndex]) % 1;
        const planePoint = project(sampleRoute(route, routeProgress));
        const nextPlanePoint = project(sampleRoute(route, Math.min(1, routeProgress + 0.004)));

        if (planePoint.z < 0.04) return;
        const planeX = center + planePoint.x * radius;
        const planeY = center + planePoint.y * radius;
        const angle = Math.atan2(nextPlanePoint.y - planePoint.y, nextPlanePoint.x - planePoint.x);
        context.save();
        context.globalAlpha = terminalFade(routeProgress);
        context.translate(planeX, planeY);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(11, 0);
        context.lineTo(-6, -3);
        context.lineTo(-2, 0);
        context.lineTo(-7, 7);
        context.lineTo(-10, 7);
        context.lineTo(-7, 0);
        context.lineTo(-10, -7);
        context.lineTo(-7, -7);
        context.lineTo(-2, 0);
        context.lineTo(-6, 3);
        context.closePath();
        context.fillStyle = "#f4f3ee";
        context.fill();
        context.strokeStyle = "#151512";
        context.lineWidth = 1;
        context.stroke();
        context.restore();
      });

      const shipDurations = [28, 34, 31];
      const shipOffsets = [0.22, 0.56, 0.81];
      seaRoutes.forEach((route, shipIndex) => {
        const shipProgress = reducedMotion
          ? 0.28 + shipIndex * 0.18
          : (elapsed / shipDurations[shipIndex] + shipOffsets[shipIndex]) % 1;
        const shipPoint = project(sampleRoute(route, shipProgress));
        const nextShipPoint = project(sampleRoute(route, Math.min(1, shipProgress + 0.004)));
        if (shipPoint.z < 0.08) return;

        const shipX = center + shipPoint.x * radius;
        const shipY = center + shipPoint.y * radius;
        const direction = nextShipPoint.x < shipPoint.x ? -1 : 1;
        context.save();
        context.globalAlpha = terminalFade(shipProgress);
        context.translate(shipX, shipY);
        context.scale(direction, 1);
        context.beginPath();
        context.moveTo(-10, 1);
        context.lineTo(10, 1);
        context.lineTo(6, 6);
        context.lineTo(-6, 6);
        context.closePath();
        context.moveTo(-4, 1);
        context.lineTo(-2, -5);
        context.lineTo(5, -5);
        context.lineTo(7, 1);
        context.moveTo(0, -5);
        context.lineTo(0, -9);
        context.lineTo(4, -9);
        context.strokeStyle = "#151512";
        context.fillStyle = "#f4f3ee";
        context.lineWidth = 1;
        context.fill();
        context.stroke();

        context.beginPath();
        context.moveTo(-8, 9);
        context.quadraticCurveTo(-3, 6, 2, 9);
        context.quadraticCurveTo(6, 11, 11, 8);
        context.strokeStyle = "rgba(18, 18, 16, 0.45)";
        context.stroke();
        context.restore();
      });

      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(18, 18, 16, 0.38)";
      context.lineWidth = 1;
      context.stroke();

      animationFrame = requestAnimationFrame(draw);
    };

    const handlePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - bounds.left) / bounds.width - 0.5,
        y: (event.clientY - bounds.top) / bounds.height - 0.5,
      };
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointer);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return (
    <div className="globe-wrap" aria-label="Globe tiga dimensi yang berputar">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <canvas ref={canvasRef} className="globe-canvas" />
      <div className="coordinate coordinate-top">51.5072° N</div>
      <div className="coordinate coordinate-bottom">06:42 GMT</div>
      <div className="route-legend">
        <span>
          <i className="route-key route-key-air" />
          Udara
        </span>
        <span>
          <i className="route-key route-key-sea" />
          Laut
        </span>
      </div>
      <div className="signal-dot" />
    </div>
  );
}

const principles = [
  {
    number: "01",
    title: "Satu dunia",
    text: "Menemukan perspektif baru melalui cerita, manusia, dan tempat yang belum dikenal.",
  },
  {
    number: "02",
    title: "Tanpa batas",
    text: "Dibuat untuk rasa ingin tahu yang tidak berhenti di satu zona waktu.",
  },
  {
    number: "03",
    title: "Selalu bergerak",
    text: "Sinyal global, dipilih dengan cermat dan dikirim setiap minggu.",
  },
];

export default function App() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Orbis, kembali ke atas">
          <span className="brand-mark" />
          ORBIS
        </a>
        <nav aria-label="Navigasi utama">
          <a href="#tentang">Tentang</a>
          <a href="#prinsip">Prinsip</a>
          <a href="mailto:hello@orbis.world">Kontak</a>
        </nav>
        <a className="nav-cta" href="#jelajah">
          Jelajahi <ArrowIcon />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>Terbitan 001</span>
            <span>Jakarta / Dunia</span>
          </div>
          <h1>
            Dunia dalam
            <span>genggaman.</span>
          </h1>
          <div className="hero-bottom">
            <p>
              Sebuah ruang digital untuk melihat dunia lebih dekat—satu cerita, satu koordinat, satu
              momen pada satu waktu.
            </p>
            <a className="primary-button" href="#jelajah">
              Mulai menjelajah <ArrowIcon />
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <CloudField />
          <div className="edition-stamp">
            <span>GLOBAL</span>
            <strong>’25</strong>
          </div>
          <Globe />
          <p className="visual-note">
            Gerakkan kursor
            <br />
            untuk mengubah orbit
          </p>
        </div>

        <div className="scroll-line">
          <span>SCROLL TO DISCOVER</span>
        </div>
      </section>

      <section className="manifesto" id="tentang">
        <div className="section-kicker">Tentang Orbis</div>
        <p>
          Bukan sekadar melihat dunia.
          <br />
          Kami ingin <em>merasakannya.</em>
        </p>
        <div className="manifesto-meta">
          <span>EST. 2025</span>
          <span>36.7783° N, 119.4179° W</span>
        </div>
      </section>

      <section className="principles" id="prinsip">
        <div className="section-heading">
          <span>Prinsip kami</span>
          <span>(03)</span>
        </div>
        <div className="principle-grid">
          {principles.map((principle) => (
            <article key={principle.number}>
              <span className="principle-number">{principle.number}</span>
              <h2>{principle.title}</h2>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing" id="jelajah">
        <span className="closing-orbit" />
        <p>Transmisi berikutnya segera dimulai.</p>
        <h2>Tetap ingin tahu.</h2>
        <a href="mailto:hello@orbis.world?subject=Join%20the%20Orbis%20signal">
          Bergabung dengan sinyal <ArrowIcon />
        </a>
      </section>

      <footer>
        <span>© 2025 ORBIS</span>
        <span>DIBUAT UNTUK PLANET BUMI</span>
        <a href="#top">KEMBALI KE ATAS ↑</a>
      </footer>
    </main>
  );
}
