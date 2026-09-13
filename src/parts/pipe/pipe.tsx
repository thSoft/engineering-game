import { definePart } from "../../engine/parts.tsx";
import z from "zod";
import { PipeView } from "./PipeView.tsx";

export const Pipe = definePart("pipe", {
  label: "Pipe",
  parameters: {
    length: {
      // Length of the pipe, in cm
      label: "Length",
      schema: z.number(),
      defaultValue: 39,
    },
  },
  inputPorts: {
    air: {
      // Whether air is going into the pipe
      label: "air",
      kind: "flow",
      schema: z.boolean(),
      defaultValue: false,
      renderAction: (value, partLabel) =>
        value ? `Start blowing ${partLabel}` : `Stop blowing ${partLabel}`,
    },
  },
  outputPorts: {
    sound: {
      // Frequency of the sound emitted by the pipe, in Hertz
      label: "sound",
      kind: "flow",
      schema: z.number(),
      defaultValue: 0,
    },
  },
  color: "#00d492",
  description: "Emits sound if air is flowing",
  render: ({ air }, _, { sound }) => {
    return <PipeView air={air} sound={sound} />;
  },
  compute: ({ air }, { length }) => ({
    sound: air ? 343.2 / (2 * (length / 100)) : 0,
  }),
});
