import Dropdown from "antd/es/dropdown/index";
import { Trash2 } from "lucide-react";
import type { ConnectionId } from "../engine/connections";
import { deleteConnection } from "../store/gameStore.ts";
import { dropdownProps, iconSize } from "./designTokens.tsx";

interface Props {
  connectionId: ConnectionId;
  children: React.ReactNode;
  open?: boolean;
}

export default function ConnectionContextMenu({ connectionId, children, open }: Props) {
  return (
    <Dropdown
      {...dropdownProps}
      open={open}
      menu={{
        items: [
          {
            key: "delete",
            label: "Delete connection",
            icon: <Trash2 size={iconSize} />,
            onClick: () => deleteConnection(connectionId),
            danger: true,
          },
        ],
      }}
    >
      {children}
    </Dropdown>
  );
}
