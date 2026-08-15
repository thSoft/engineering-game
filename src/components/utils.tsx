import { ReactNode } from "react";

export function displayPortValue(portValue: any): ReactNode {
  return portValue ? "ON" : "OFF";
}
