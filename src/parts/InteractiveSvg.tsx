import { useNodeId, useUpdateNodeInternals } from "@xyflow/react";
import { Props, ReactSVG } from "react-svg";
import {
  BaseSyntheticEvent,
  EventHandler,
  MouseEventHandler,
  PointerEventHandler,
  ReactNode,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import _ from "lodash";
import { css } from "@emotion/react";

type ReactSvgTarget = SVGSVGElement | HTMLSpanElement | HTMLDivElement;

interface _Props {
  /* ReactSVG props */
  props: Props;
  /* Label to CSS */
  styles?: Record<string, string>;
  /* Label to click handler */
  onClicks?: Record<string, MouseEventHandler<ReactSvgTarget>>;
  /* Label to drag handler */
  onDrags?: Record<string, PointerEventHandler<ReactSvgTarget>>;
  /* Label to overlay renderer */
  overlays?: Record<string, () => ReactNode>;
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
  styles = {},
  onClicks = {},
  onDrags = {},
  overlays = {},
  boundingBoxDependencies = [],
}: _Props) {
  const [boundingBoxes, setBoundingBoxes] = useState<Record<string, BoundingBox>>({});
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();
  const [dragState, setDragState] = useState<{
    label: string;
  } | null>(null);
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
      _.mapValues(onDrags, (_, label) => () => {
        setDragState({ label });
      }),
    );
  };
  const handlePointerMove = (event: React.PointerEvent<ReactSvgTarget>) => {
    if (dragState !== null) {
      onDrags[dragState.label]?.(event);
    }
  };
  const handlePointerUp = (_: React.PointerEvent<ReactSvgTarget>) => {
    setDragState(null);
  };
  return (
    <span style={{ position: "relative" }}>
      <ReactSVG
        {...props}
        css={Object.entries(styles).map(([label, declarations]) => style(label, declarations))}
        onClick={(event) => handle(event, onClicks)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        afterInjection={setOwnerSVGElement}
      />
      {_.map(overlays, (renderOverlay, label) => {
        const rect = boundingBoxes[label];
        if (!rect) return null;
        return (
          <span
            key={label}
            style={{
              position: "absolute",
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          >
            {renderOverlay()}
          </span>
        );
      })}
    </span>
  );

  function updateBoundingBoxes(svg: SVGSVGElement) {
    setBoundingBoxes(
      Object.fromEntries(
        Object.keys(overlays).flatMap((label) => {
          const element = svg.querySelector(labelSelector(label));
          if (element instanceof SVGGraphicsElement) {
            const boundingBox = getTransformedBBox(element);
            return [[label, boundingBox]];
          } else {
            return [];
          }
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
  handlers: Record<string, EventHandler<Event>>,
) {
  for (const [label, handler] of Object.entries(handlers)) {
    if (targets(event, label)) {
      handler(event);
    }
  }
}

function targets(event: BaseSyntheticEvent, label: string) {
  return event.target instanceof Element && event.target.closest(labelSelector(label));
}

function labelSelector(label: string) {
  return `[*|label="${label}"]`;
}
