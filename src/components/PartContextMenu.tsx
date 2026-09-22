import Dropdown from "antd/es/dropdown/dropdown";
import { Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { PartId } from "../engine/parts.tsx";
import { deletePart } from "../store/gameStore.ts";
import { dropdownProps, iconSize } from "./designTokens.tsx";

interface Props {
  partId: PartId;
  children: ReactNode;
}

export default function PartContextMenu({ partId, children }: Props) {
  return (
    <Dropdown
      {...dropdownProps}
      trigger={["click"]}
      menu={{
        items: [
          {
            key: "delete",
            label: "Delete part",
            icon: <Trash2 size={iconSize} />,
            onClick: () => deletePart(partId),
            danger: true,
          },
        ],
      }}
    >
      {children}
    </Dropdown>
  );
}
