import { useNodeId, useUpdateNodeInternals } from "@xyflow/react";
import { Props as ReactSVGProps, ReactSVG } from "react-svg";
import {
  EventHandler,
  MouseEventHandler,
  PointerEventHandler,
  ReactNode,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import { css } from "@emotion/react";

type ReactSvgTarget = SVGSVGElement | HTMLSpanElement | HTMLDivElement;

interface LabelTarget {
  label: string;
  /* Prefix added to cloned element labels by the SVG loader. */
  parentLabel?: string;
}

interface Props {
  /* ReactSVG props */
  props: ReactSVGProps;
  /* Label to CSS */
  styles?: (LabelTarget & { declarations: string })[];
  /* Label to click handler */
  onClicks?: (LabelTarget & { handler: MouseEventHandler<ReactSvgTarget> })[];
  /* Label to drag handler */
  onDrags?: (LabelTarget & { handler: PointerEventHandler<ReactSvgTarget> })[];
  /* Label to overlay renderer */
  overlays?: (LabelTarget & { render: () => ReactNode })[];
  /* Anything the bounding boxes depend on */
  boundingBoxDependencies?: any[];
}

type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function InteractiveSvg({
  props,
  styles = [],
  onClicks = [],
  onDrags = [],
  overlays = [],
  boundingBoxDependencies = [],
}: Props) {
  const [boundingBoxes, setBoundingBoxes] = useState<Record<string, BoundingBox>>({});
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();
  const [dragState, setDragState] = useState<LabelTarget | null>(null);
  const [ownerSVGElement, setOwnerSVGElement] = useState<SVGSVGElement | null>(null);
  useEffect(() => {
    if (ownerSVGElement !== null) {
      updateBoundingBoxes(ownerSVGElement);
    }
  }, [ownerSVGElement, ...boundingBoxDependencies]);

  const handlePointerDown = (event: React.PointerEvent<ReactSvgTarget>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    target.setPointerCapture(event.pointerId);
    handle(
      event,
      onDrags.map(({ label, parentLabel }) => ({
        label,
        parentLabel,
        handler: () => {
          setDragState({ label, parentLabel });
        },
      })),
    );
  };
  const handlePointerMove = (event: React.PointerEvent<ReactSvgTarget>) => {
    if (dragState !== null) {
      onDrags.find((target) => sameTarget(target, dragState))?.handler(event);
    }
  };
  const handlePointerUp = (_: React.PointerEvent<ReactSvgTarget>) => {
    setDragState(null);
  };
  return (
    <span style={{ position: "relative" }}>
      <ReactSVG
        {...props}
        css={styles.flatMap(({ label, parentLabel, declarations }) =>
          style(getTargetLabel({ label, parentLabel }), declarations),
        )}
        onClick={(event) => handle(event, onClicks)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        afterInjection={setOwnerSVGElement}
      />
      {overlays.map(({ label, parentLabel, render }) => {
        const targetLabel = getTargetLabel({ label, parentLabel });
        const rect = boundingBoxes[targetLabel];
        if (!rect) return null;
        return (
          <span
            key={targetLabel}
            style={{
              position: "absolute",
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          >
            {render()}
          </span>
        );
      })}
    </span>
  );

  function updateBoundingBoxes(svg: SVGSVGElement) {
    setBoundingBoxes(
      Object.fromEntries(
        overlays.flatMap(({ label, parentLabel }) => {
          const targetLabel = getTargetLabel({ label, parentLabel });
          const element = svg.querySelector(labelSelector(targetLabel));
          return element instanceof SVGGraphicsElement
            ? [[targetLabel, getTransformedBBox(element)]]
            : [];
        }),
      ),
    );
    if (nodeId !== null) updateNodeInternals(nodeId);
  }
}

function getTransformedBBox(element: SVGGraphicsElement): BoundingBox {
  const bbox = element.getBBox();
  const ctm = element.getCTM();

  if (!ctm) return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };

  const svg = element instanceof SVGSVGElement ? element : element.ownerSVGElement!;

  const points: SVGPoint[] = [
    svg.createSVGPoint(),
    svg.createSVGPoint(),
    svg.createSVGPoint(),
    svg.createSVGPoint(),
  ];

  points[0].x = bbox.x;
  points[0].y = bbox.y;
  points[1].x = bbox.x + bbox.width;
  points[1].y = bbox.y;
  points[2].x = bbox.x + bbox.width;
  points[2].y = bbox.y + bbox.height;
  points[3].x = bbox.x;
  points[3].y = bbox.y + bbox.height;

  const transformedPoints = points.map((pt) => pt.matrixTransform(ctm));

  const xs = transformedPoints.map((pt) => pt.x);
  const ys = transformedPoints.map((pt) => pt.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function style(label: string, declarations: string) {
  return css`
    ${labelSelector(label)} {
      ${declarations}
    }
  `;
}

function handle<Event extends SyntheticEvent<any>>(
  event: Event,
  handlers: (LabelTarget & { handler: EventHandler<Event> })[],
) {
  for (const { label, parentLabel, handler } of handlers) {
    if (
      event.target instanceof Element &&
      event.target.closest(labelSelector(getTargetLabel({ label, parentLabel })))
    ) {
      handler(event);
    }
  }
}

function getTargetLabel({ label, parentLabel }: LabelTarget) {
  return parentLabel ? `${parentLabel}_${label}` : label;
}

function sameTarget(a: LabelTarget, b: LabelTarget) {
  return a.label === b.label && a.parentLabel === b.parentLabel;
}

function labelSelector(label: string) {
  return `[*|label="${label}"]`;
}
