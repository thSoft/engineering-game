import { DropdownProps } from "antd";

export const stateColor = "#A78BFA";
export const eventColor = "#FB923C";
export const connectableColor = "#6ee7b7";
export const borderColor = "#334155";
export const modalWidth = "50%";
export const headerStyle = {
  height: 48,
  borderBottom: `1px solid ${borderColor}`,
  display: "flex",
  alignItems: "center",
  padding: 8,
};
export const iconSize = 16;
export const selectedColor = "#ffffff";
export const transitionSettings = `0.05s ease-in-out`;
export const dropdownProps: DropdownProps = {
  styles: { root: { minWidth: 0 } },
  placement: "top",
  arrow: true,
};
export const workbenchBackgroundColor = "#11172A";
