import {
  Camera,
  Mesh,
  Plane,
  Program,
  Renderer,
  Texture,
  Transform,
} from "ogl";
import { useState, useEffect, useMemo, useRef } from "react";
import { fetchApplications } from "../hooks/api";
import { Application } from "../types";

type Product = Application;

interface GalleryItem {
  image: string;
  text: string;
  url?: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const CARD_COLORS = [
  "#00D4FF",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
];

function getCardColor(index: number) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

function createCardImage(product: Product, isDark: boolean): string {
  const background = isDark ? "#0f172a" : "#ffffff";
  const background2 = isDark ? "#020617" : "#f8fafc";
  const titleColor = isDark ? "#ffffff" : "#0f172a";
  const descColor = isDark ? "#cbd5e1" : "#475569";
  const borderOpacity = isDark ? "0.45" : "0.8";
  const buttonOpacity = isDark ? "0.16" : "0.1";
  const cardColor = product.color || "#00D4FF";
  const categoryText = product.categories?.join(", ") || "";

  const svg = `
    <svg width="900" height="560" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="${background2}"/>
        </linearGradient>
      </defs>

      <rect width="900" height="560" rx="42" fill="url(#bg)"/>
      <rect x="2" y="2" width="896" height="556" rx="42" fill="none" stroke="${cardColor}" stroke-opacity="${borderOpacity}" stroke-width="3"/>

      <circle cx="105" cy="105" r="48" fill="${cardColor}" fill-opacity="0.18"/>
      <text x="105" y="123" text-anchor="middle" font-size="52" font-family="Arial" font-weight="700" fill="${cardColor}">
        ${String(product.title || "").charAt(0).toUpperCase()}
      </text>

      <text x="72" y="220" font-size="54" font-family="Arial" font-weight="800" fill="${titleColor}">
        ${product.title}
      </text>

      <text x="72" y="270" font-size="22" font-family="Arial" font-weight="700" fill="${cardColor}">
        ${categoryText}
      </text>

      <foreignObject x="72" y="310" width="740" height="120">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;color:${descColor};font-size:27px;line-height:1.45;">
          ${product.description}
        </div>
      </foreignObject>

      <rect x="72" y="460" width="150" height="48" rx="24" fill="${cardColor}" fill-opacity="${buttonOpacity}" stroke="${cardColor}" stroke-opacity="0.45"/>
      <text x="147" y="492" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="${cardColor}">
        Launch &gt;
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

class GalleryApp {
  container: HTMLElement;
  sourceItems: GalleryItem[];
  isInfinite: boolean;
  items: GalleryItem[];
  scroll: { current: number; target: number; ease: number };
  medias: any[];
  hovered: any;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;
  geometry: any;
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  cardWidth!: number;
  cardHeight!: number;
  gap!: number;
  unit!: number;
  loopWidth!: number;
  raf!: number;

  constructor(container: HTMLElement, items: GalleryItem[]) {
    this.container = container;
    this.sourceItems = items;
    this.isInfinite = items.length >= 3;
    this.items = this.isInfinite ? [...items, ...items, ...items, ...items] : items;

    this.scroll = {
      current: 0,
      target: 0,
      ease: 0.06,
    };

    this.medias = [];
    this.hovered = null;

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias();
    this.addEvents();
    this.update();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min((window as any).devicePixelRatio || 1, 2),
    });

    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.geometry = new Plane(this.gl, {
      widthSegments: 60,
      heightSegments: 40,
    });
  }

  createMedias() {
    this.medias = this.items.map((item, index) => {
      const texture = new Texture(this.gl, {
        generateMipmaps: false,
        minFilter: this.gl.LINEAR,
        magFilter: this.gl.LINEAR,
      });

      const image = new Image();
      image.src = item.image;

      image.onload = () => {
        texture.image = image;
      };

      const program = new Program(this.gl, {
        transparent: true,
        depthTest: false,
        depthWrite: false,
        vertex: `
          attribute vec3 position;
          attribute vec2 uv;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragment: `
          precision highp float;
          uniform sampler2D tMap;
          varying vec2 vUv;

          void main() {
            vec4 color = texture2D(tMap, vUv);
            gl_FragColor = color;
          }
        `,
        uniforms: {
          tMap: { value: texture },
        },
      });

      const mesh = new Mesh(this.gl, {
        geometry: this.geometry,
        program,
      });

      mesh.setParent(this.scene);

      return {
        mesh,
        item,
        index,
        scale: 1,
      };
    });
  }

  onResize = () => {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };

    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });

    const fov = ((this.camera as any).fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.viewport = { width, height };

    this.cardWidth = this.viewport.width * 0.3;
    this.cardHeight = this.cardWidth * 0.62;
    this.gap = this.cardWidth * 0.22;
    this.unit = this.cardWidth + this.gap;
    this.loopWidth = this.unit * this.items.length;

    this.medias.forEach((media) => {
      media.mesh.scale.x = this.cardWidth;
      media.mesh.scale.y = this.cardHeight;
    });
  };

  onWheel = (event: WheelEvent) => {
    if (!this.isInfinite) return;

    event.preventDefault();

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

    this.scroll.target += delta * 0.015;
  };

  slideLeft = () => {
    if (!this.isInfinite) return;
    this.scroll.target -= this.unit;
  };

  slideRight = () => {
    if (!this.isInfinite) return;
    this.scroll.target += this.unit;
  };

  onMouseMove = (event: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width - 0.5) * this.viewport.width;

    const y =
      (0.5 - (event.clientY - rect.top) / rect.height) * this.viewport.height;

    this.hovered = null;

    for (const media of this.medias) {
      const mx = media.mesh.position.x;
      const my = media.mesh.position.y;
      const sx = media.mesh.scale.x / 2;
      const sy = media.mesh.scale.y / 2;

      if (x >= mx - sx && x <= mx + sx && y >= my - sy && y <= my + sy) {
        this.hovered = media;
        break;
      }
    }

    this.container.style.cursor = this.hovered ? "pointer" : "default";
  };

  onMouseLeave = () => {
    this.hovered = null;
    this.container.style.cursor = "default";
  };

  onClick = () => {
    if (this.hovered?.item?.url) {
      window.open(this.hovered.item.url, "_blank", "noopener,noreferrer");
    }
  };

  addEvents() {
    window.addEventListener("resize", this.onResize);

    this.container.addEventListener("wheel", this.onWheel, {
      passive: false,
    });

    this.container.addEventListener("mousemove", this.onMouseMove);
    this.container.addEventListener("mouseleave", this.onMouseLeave);
    this.container.addEventListener("click", this.onClick);
  }

  update = () => {
    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease,
    );

    const halfViewport = this.viewport.width / 2;
    const loopWidth = this.loopWidth || this.unit * this.items.length;

    this.medias.forEach((media) => {
      let x;

      if (this.isInfinite) {
        x = media.index * this.unit - this.scroll.current;
        x = ((x + loopWidth / 2) % loopWidth) - loopWidth / 2;

        if (x < -loopWidth / 2) x += loopWidth;
        if (x > loopWidth / 2) x -= loopWidth;
      } else {
        const totalWidth = (this.items.length - 1) * this.unit;
        const startX = -totalWidth / 2;
        x = startX + media.index * this.unit;
      }

      const bend = this.isInfinite ? 2.4 : 0;

      if (bend === 0) {
        media.mesh.position.x = x;
        media.mesh.position.y = 0;
        media.mesh.rotation.z = 0;
      } else {
        const radius = (halfViewport * halfViewport + bend * bend) / (2 * bend);

        const effectiveX = Math.min(Math.abs(x), halfViewport);
        const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX);

        media.mesh.position.x = x;
        media.mesh.position.y = -arc;
        media.mesh.rotation.z = -Math.sign(x) * Math.asin(effectiveX / radius);
      }

      const targetScale = media === this.hovered ? 1.12 : 1;
      media.scale = lerp(media.scale, targetScale, 0.15);

      media.mesh.scale.x = this.cardWidth * media.scale;
      media.mesh.scale.y = this.cardHeight * media.scale;
    });

    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });

    this.raf = requestAnimationFrame(this.update);
  };

  destroy() {
    cancelAnimationFrame(this.raf);

    window.removeEventListener("resize", this.onResize);
    this.container.removeEventListener("wheel", this.onWheel);
    this.container.removeEventListener("mousemove", this.onMouseMove);
    this.container.removeEventListener("mouseleave", this.onMouseLeave);
    this.container.removeEventListener("click", this.onClick);

    if (this.gl?.canvas?.parentNode) {
      this.gl.canvas.parentNode.removeChild(this.gl.canvas);
    }
  }
}

export default function Carousel({
  theme,
}: {
  theme: string;
}): React.JSX.Element {
  const [products, setProducts] = useState<Application[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryAppRef = useRef<GalleryApp | null>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchApplications();
        setProducts(data.filter((app) => app.visibility));
      } catch (err) {
        console.error(err);
      }
    };

    void load();
  }, []);

  const filterOptions = useMemo(() => {
    const categories = products.flatMap((app) => app.categories || []);
    return ["All", ...Array.from(new Set(categories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedFilter === "All") {
      return products;
    }

    return products.filter((product) =>
      product.categories?.includes(selectedFilter),
    );
  }, [products, selectedFilter]);

  const galleryItems = useMemo(() => {
    return filteredProducts.map((product, index) => ({
      image: createCardImage(
        {
          ...product,
          color: getCardColor(index),
        },
        isDark,
      ),
      text: product.title,
      url: product.link,
    }));
  }, [filteredProducts, isDark]);

  useEffect(() => {
    const handleClick = () => setDropdownOpen(false);

    if (dropdownOpen) {
      window.addEventListener("click", handleClick);
    }

    return () => window.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!galleryRef.current || galleryItems.length === 0) return;

    const app = new GalleryApp(galleryRef.current, galleryItems);
    galleryAppRef.current = app;

    return () => {
      app.destroy();
      galleryAppRef.current = null;
    };
  }, [galleryItems]);

  return (
    <div className="relative w-full">
      <div className="relative z-50 mx-auto flex max-w-7xl justify-end px-2 pb-3 md:px-8 md:pb-0">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative min-w-[180px] md:min-w-[220px]"
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[var(--panel-border)] bg-[var(--dropdown-bg)] px-4 py-3 text-[13px] font-bold text-[var(--dropdown-text)] shadow-[var(--card-shadow)] backdrop-blur-2xl"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((prev) => !prev);
            }}
          >
            <span>{selectedFilter}</span>

            <span
              className={`inline-block text-xs text-[var(--accent)] transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              v
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 z-[999] w-full overflow-hidden rounded-2xl border border-[var(--panel-border)] bg-[var(--dropdown-bg)] shadow-[var(--dropdown-shadow)] backdrop-blur-2xl [animation:dropIn_0.18s_ease]">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(option);
                    setDropdownOpen(false);
                  }}
                  className={`w-full cursor-pointer border-0 bg-transparent px-4 py-3 text-left text-[13px] font-semibold text-[var(--dropdown-text)] transition duration-150 hover:bg-blue-600/10 hover:text-[var(--accent)] ${
                    selectedFilter === option
                      ? "bg-blue-600/10 text-[var(--accent)]"
                      : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {galleryItems.length > 0 ? (
        <div className="mx-auto -mt-[22px] flex w-full max-w-[1700px] items-center justify-center gap-2 px-0 md:gap-[18px] md:px-2">
          <button
            type="button"
            className="relative z-20 flex h-10 w-10 min-w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--arrow-bg)] text-[28px] leading-none text-[var(--arrow-color)] shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-[14px] transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 md:h-12 md:w-12 md:min-w-12 md:text-[32px]"
            onClick={() => galleryAppRef.current?.slideLeft()}
            disabled={galleryItems.length < 3}
            aria-label="Previous"
          >
            &lt;
          </button>

          <div className="relative mx-auto h-[300px] w-full min-w-0 max-w-[1550px] flex-1 overflow-hidden max-[1100px]:h-[390px] md:h-[390px]">
            <div
              ref={galleryRef}
              className="circular-gallery-canvas h-full w-full translate-y-[-15px] overflow-hidden"
            />
          </div>

          <button
            type="button"
            className="relative z-20 flex h-10 w-10 min-w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--arrow-bg)] text-[28px] leading-none text-[var(--arrow-color)] shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-[14px] transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 md:h-12 md:w-12 md:min-w-12 md:text-[32px]"
            onClick={() => galleryAppRef.current?.slideRight()}
            disabled={galleryItems.length < 3}
            aria-label="Next"
          >
            &gt;
          </button>
        </div>
      ) : (
        <div className="flex min-h-[220px] items-center justify-center text-slate-500">
          No applications found.
        </div>
      )}
    </div>
  );
}