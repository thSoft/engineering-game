import { useNodeId, useUpdateNodeInternals } from "@xyflow/react";
import { Props, ReactSVG } from "react-svg";
import { MouseEventHandler, ReactNode, useState } from "react";
import _ from "lodash";
import { css } from "@emotion/react";

interface _Props {
  /* ReactSVG props */
  props: Props;
  /* Label to CSS */
  styles?: Record<string, string>;
  /* Label to click handler */
  onClicks?: Record<string, MouseEventHandler<SVGSVGElement | HTMLSpanElement | HTMLDivElement>>;
  /* Label to overlay renderer */
  overlays?: Record<string, () => ReactNode>;
}

export function InteractiveSvg({ props, styles = {}, onClicks = {}, overlays = {} }: _Props) {
  const [boundingBoxes, setBoundingBoxes] = useState<Record<string, DOMRect>>({});
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();
  return (
    <span style={{ position: "relative" }}>
      <ReactSVG
        {...props}
        css={Object.entries(styles).map(([label, declarations]) => style(label, declarations))}
        onClick={(event) => {
          for (const [label, handler] of Object.entries(onClicks)) {
            if (targets(event, label)) {
              handler(event);
            }
          }
        }}
        afterInjection={(svg) => {
          setBoundingBoxes(
            Object.fromEntries(
              Object.keys(overlays).flatMap((label) => {
                const element = svg.querySelector(labelSelector(label));
                if (element instanceof SVGGraphicsElement) {
                  const boundingBox = element.getBBox();
                  return [[label, boundingBox]];
                } else {
                  return [];
                }
              }),
            ),
          );
          if (nodeId !== null) updateNodeInternals(nodeId);
        }}
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
}

function labelSelector(label: string) {
  return `[*|label="${label}"]`;
}

function style(label: string, declarations: string) {
  return css`
    ${labelSelector(label)} {
      ${declarations}
    }
  `;
}

function targets(event: React.MouseEvent, label: string) {
  return event.target instanceof Element && event.target.closest(labelSelector(label));
}
