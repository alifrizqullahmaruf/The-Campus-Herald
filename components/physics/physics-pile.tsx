"use client";

import type * as MatterNS from "matter-js";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { canAnimate, isDrag, prefersReducedMotion, toLocal, type Point } from "@/lib/motion";

/** Where an item rests before (or without) physics: percent of the container. */
export interface RestPose {
  left: number; // 0–100, item centre
  top: number; // 0–100, item centre
  rotate: number; // degrees
}

export interface PileItem {
  key: string | number;
  node: ReactNode;
  rest: RestPose;
  /** Round stickers collide as circles. */
  shape?: "box" | "circle";
  /** Decorative stickers are hidden from assistive tech. */
  decorative?: boolean;
  /** Extra classes on the item wrapper, e.g. `max-sm:hidden` to leave it out on phones. */
  className?: string;
}

type Status = "pending" | "running" | "static";

/**
 * A pile of real DOM elements (links stay clickable and focusable) driven by a
 * Matter.js simulation: items drop in, tumble, collide with the container's
 * floor and walls and with any `[data-physics-obstacle]` element inside it, and
 * can be picked up and thrown (template: hero cards and footer pills).
 *
 * - Matter.js is only downloaded when the pile starts (`import()`), after the
 *   page has loaded (`start="load"`) or when the pile scrolls into view
 *   (`start="view"`), so it never delays the first paint.
 * - With JavaScript off, reduced motion, or if loading fails, items stay at
 *   their rest poses (globals.css `[data-physics]` rules).
 * - A press that moves less than DRAG_THRESHOLD is a normal click.
 * - The simulation pauses when the pile is off screen or the tab is hidden.
 */
export function PhysicsPile({
  items,
  start = "load",
  list,
  className,
  children,
}: {
  items: PileItem[];
  start?: "load" | "view";
  /** Render the items as a list with this accessible name (they stay absolutely positioned). */
  list?: string;
  className?: string;
  /** Static content inside the container (e.g. the headline, used as obstacles). */
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (prefersReducedMotion() || !canAnimate()) {
      container.dataset.physics = "static";
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    // If Matter.js cannot start soon, show the static pile instead of hidden items.
    let fallback = 0;
    const armFallback = () => {
      fallback ||= window.setTimeout(() => {
        if (container.dataset.physics === "pending") container.dataset.physics = "static";
      }, 2500);
    };

    const boot = async () => {
      try {
        // matter-js is CommonJS: depending on the bundler the API is on .default.
        const mod = (await import("matter-js")) as MatterModule & { default?: MatterModule };
        const Matter = mod.default ?? mod;
        if (cancelled) return;
        // Late (the fallback already shows the static pile): start from the rest
        // poses instead of hiding the items and dropping them in again.
        cleanup = runPile(Matter, container, container.dataset.physics === "pending");
        window.clearTimeout(fallback);
      } catch {
        container.dataset.physics = "static";
      }
    };

    let observer: IntersectionObserver | undefined;
    if (start === "view") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer?.disconnect();
            armFallback();
            void boot();
          }
        },
        { threshold: 0.25 },
      );
      observer.observe(container);
    } else {
      armFallback();
      const go = () =>
        "requestIdleCallback" in window ? requestIdleCallback(() => void boot(), { timeout: 800 }) : setTimeout(boot, 200);
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      observer?.disconnect();
      cleanup?.();
    };
  }, [start]);

  const ItemTag = list ? "li" : "div";
  const bodies = items.map((item) => (
    <ItemTag
      key={item.key}
          data-body={item.shape ?? "box"}
          aria-hidden={item.decorative || undefined}
          className={cx("absolute top-0 left-0 select-none", item.className)}
          style={
            {
              "--rest-left": `${item.rest.left}%`,
              "--rest-top": `${item.rest.top}%`,
              "--rest-rotate": `${item.rest.rotate}deg`,
            } as CSSProperties
          }
    >
      {item.node}
    </ItemTag>
  ));

  return (
    <div ref={containerRef} data-physics={"pending" satisfies Status} className={cx("relative", className)}>
      {children}
      {list ? (
        // display: contents keeps each li positioned against the container.
        <ul aria-label={list} className="contents">
          {bodies}
        </ul>
      ) : (
        bodies
      )}
      {/* Local (0, 0), (100, 0) and (0, 100): where these land on screen tells the
          drag code how ancestors (the hero tilt) transform the pile. */}
      {PROBES.map(([left, top]) => (
        <span key={`${left},${top}`} data-physics-probe aria-hidden="true" className="pointer-events-none absolute size-0" style={{ left, top }} />
      ))}
    </div>
  );
}

const PROBES = [
  [0, 0],
  [100, 0],
  [0, 100],
] as const;

type MatterModule = typeof MatterNS;

/** Builds the world, runs the loop and wires dragging. Returns a cleanup. */
function runPile(Matter: MatterModule, container: HTMLElement, dropIn: boolean): () => void {
  const { Engine, Bodies, Body, Composite, Constraint } = Matter;
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = 1.1;

  // Items hidden at this screen size (display: none) take no part in the simulation.
  const elements = Array.from(container.querySelectorAll<HTMLElement>("[data-body]")).filter((el) => el.offsetWidth > 0);
  // Layout sizes, not bounding boxes: a tilted ancestor inflates the boxes.
  let width = container.offsetWidth;
  let height = container.offsetHeight;
  const probes = Array.from(container.querySelectorAll<HTMLElement>("[data-physics-probe]"));
  const corner = (el: HTMLElement): Point => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top };
  };
  /** Viewport point → container coordinates, correct while the hero is tilted. */
  const toContainer = (x: number, y: number) => {
    const [origin, xAxis, yAxis] = probes.map(corner);
    return toLocal({ x, y }, origin, xAxis, yAxis);
  };
  const centre = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return toContainer(r.left + r.width / 2, r.top + r.height / 2);
  };

  // Bodies start where the static pile put them. When dropping in, they are
  // lifted above the container so they fall one after another.
  const bodies = elements.map((el, i) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const rest = centre(el);
    const cx = rest.x;
    const options = { restitution: 0.25, friction: 0.5, frictionAir: 0.012, density: 0.002 };
    const body =
      el.dataset.body === "circle"
        ? Bodies.circle(cx, 0, w / 2, options)
        : Bodies.rectangle(cx, 0, w, h, { ...options, chamfer: { radius: Math.min(14, h / 4) } });
    if (dropIn) {
      Body.setPosition(body, { x: cx, y: -h - i * 90 - 40 });
      Body.setAngle(body, (((i * 37) % 50) - 25) * (Math.PI / 180));
      Body.setAngularVelocity(body, (i % 2 ? 1 : -1) * 0.02);
    } else {
      Body.setPosition(body, rest);
      Body.setAngle(body, (parseFloat(el.style.getPropertyValue("--rest-rotate")) || 0) * (Math.PI / 180));
    }
    return { el, body, w, h };
  });

  // Floor, walls and obstacles (headline lines, wordmark letters, ...).
  let statics: MatterNS.Body[] = [];
  const buildStatics = () => {
    Composite.remove(engine.world, statics);
    const t = 200;
    statics = [
      Bodies.rectangle(width / 2, height + t / 2, width + 2 * t, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, height / 2 - height, t, height * 3, { isStatic: true }),
      Bodies.rectangle(width + t / 2, height / 2 - height, t, height * 3, { isStatic: true }),
      ...Array.from(container.querySelectorAll<HTMLElement>("[data-physics-obstacle]")).map((ob) => {
        const c = centre(ob);
        return Bodies.rectangle(c.x, c.y, ob.offsetWidth, ob.offsetHeight, {
          isStatic: true,
          chamfer: { radius: 6 },
        });
      }),
    ];
    Composite.add(engine.world, statics);
  };
  buildStatics();
  Composite.add(
    engine.world,
    bodies.map((b) => b.body),
  );

  const render = () => {
    for (const { el, body, w, h } of bodies) {
      // Anything that escapes (thrown very hard) is dropped back in.
      if (body.position.y > height + 300 || body.position.x < -300 || body.position.x > width + 300) {
        Body.setPosition(body, { x: width / 2, y: -h });
        Body.setVelocity(body, { x: 0, y: 0 });
      }
      el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    }
  };
  render();
  container.dataset.physics = "running" satisfies Status;

  // Loop: fixed 60 Hz steps, paused off screen or in a background tab.
  let frame = 0;
  let last = performance.now();
  let acc = 0;
  let visible = true;
  const step = 1000 / 60;
  const tick = (now: number) => {
    acc = Math.min(acc + (now - last), 100);
    last = now;
    while (acc >= step) {
      Engine.update(engine, step);
      acc -= step;
    }
    render();
    frame = requestAnimationFrame(tick);
  };
  const play = () => {
    if (!visible || document.hidden) return;
    cancelAnimationFrame(frame);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const stop = () => cancelAnimationFrame(frame);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) play();
    else stop();
  });
  io.observe(container);
  const onVisibility = () => (document.hidden ? stop() : play());
  document.addEventListener("visibilitychange", onVisibility);
  play();

  // Rebuild walls and obstacles when the layout changes width.
  const ro = new ResizeObserver(() => {
    if (Math.abs(container.offsetWidth - width) < 1 && Math.abs(container.offsetHeight - height) < 1) return;
    width = container.offsetWidth;
    height = container.offsetHeight;
    buildStatics();
    for (const { body } of bodies) {
      Body.setPosition(body, { x: Math.min(Math.max(body.position.x, 20), width - 20), y: Math.min(body.position.y, height - 20) });
    }
  });
  ro.observe(container);

  // Dragging: a constraint pulls the grabbed body towards the pointer.
  let grab: {
    pointerId: number;
    body: MatterNS.Body;
    el: HTMLElement;
    sx: number;
    sy: number;
    constraint?: MatterNS.Constraint;
  } | null = null;
  let suppressClick = false;
  const local = (e: PointerEvent) => toContainer(e.clientX, e.clientY);
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-body]");
    const hit = bodies.find((b) => b.el === el);
    if (!hit) return;
    grab = { pointerId: e.pointerId, body: hit.body, el: hit.el, sx: e.clientX, sy: e.clientY };
    suppressClick = false;
  };
  const onMove = (e: PointerEvent) => {
    if (!grab || grab.pointerId !== e.pointerId) return;
    const p = local(e);
    if (!grab.constraint) {
      if (!isDrag(e.clientX - grab.sx, e.clientY - grab.sy)) return;
      suppressClick = true;
      container.setPointerCapture(e.pointerId);
      grab.el.dataset.grabbed = "true";
      const { body } = grab;
      const offset = Matter.Vector.rotate(
        { x: p.x - body.position.x, y: p.y - body.position.y },
        -body.angle,
      );
      grab.constraint = Constraint.create({ pointA: p, bodyB: body, pointB: offset, stiffness: 0.15, damping: 0.08, length: 0 });
      Composite.add(engine.world, grab.constraint);
    }
    grab.constraint.pointA = p;
  };
  const onUp = (e: PointerEvent) => {
    if (!grab || grab.pointerId !== e.pointerId) return;
    if (grab.constraint) Composite.remove(engine.world, grab.constraint);
    delete grab.el.dataset.grabbed;
    grab = null;
    // The click ending this drag (if the browser sends one) fires before this
    // timeout; touch throws send none, and a later Enter must still work.
    if (suppressClick) window.setTimeout(() => (suppressClick = false), 0);
  };
  // Links would otherwise start the browser's own drag and cancel ours.
  const onDragStart = (e: DragEvent) => e.preventDefault();
  // Swallow the click that ends a drag, so throwing a card does not open it.
  const onClick = (e: MouseEvent) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }
  };
  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);
  container.addEventListener("click", onClick, true);
  container.addEventListener("dragstart", onDragStart);

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    container.removeEventListener("pointerdown", onDown);
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerup", onUp);
    container.removeEventListener("pointercancel", onUp);
    container.removeEventListener("click", onClick, true);
    container.removeEventListener("dragstart", onDragStart);
    Engine.clear(engine);
    Composite.clear(engine.world, false);
  };
}
