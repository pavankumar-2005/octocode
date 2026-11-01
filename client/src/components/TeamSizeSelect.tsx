import { Select, SelectItem } from "@heroui/react";
import { MAX_TEAM } from "../lib/api";
import { UsersIcon } from "./Icons";

const SIZES = Array.from({ length: MAX_TEAM }, (_, i) => i + 1); // [1, 2, ..., 6]

type Props = { value: number | null; onChange: (size: number) => void; className?: string };

// "How many people will work in this room?" No default on purpose: the user must choose.
export default function TeamSizeSelect({ value, onChange, className }: Props) {
  return (
    <Select
      label="Team size"
      size="sm"
      isRequired
      placeholder="Choose"
      className={className}
      startContent={<UsersIcon size={14} className="text-default-400" />}
      selectedKeys={value ? [String(value)] : []}
      onSelectionChange={(keys) => {
        const key = Array.from(keys)[0];
        if (key) onChange(Number(key));
      }}
    >
      {SIZES.map((n) => (
        <SelectItem key={String(n)}>{n === 1 ? "Just me" : `${n} people`}</SelectItem>
      ))}
    </Select>
  );
}
