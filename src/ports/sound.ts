import { PortType } from "../engine/parts.ts";
import z from "zod";

export const Sound = z.optional(
  z.object({
    frequency: z.number(), // Frequency of the sound emitted by the pipe, in Hertz
  }),
);

export type Sound = z.infer<typeof Sound>;

export const sound: PortType<Sound> = {
  schema: Sound,
  renderConnection: () => [],
};
