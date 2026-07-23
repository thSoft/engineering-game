import { Connection } from "./connections";
import { PartInstance } from "./parts";

export interface Puzzle {
  name: string;
  parts: PartInstance[];
  connections: Connection[];
}
