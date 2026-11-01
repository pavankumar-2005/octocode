import { Card, CardBody, Chip } from "@heroui/react";
import { MAX_TEAM, type Room } from "../lib/api";
import { getLanguage } from "../lib/languages";
import { ArrowRightIcon, UsersIcon } from "./Icons";

type Props = { project: Room; isOwner: boolean; onOpen: () => void };

// One project card, used on the Home page ("past projects") and the Projects dashboard.
export default function ProjectTile({ project, isOwner, onOpen }: Props) {
  const lang = getLanguage(project.language);
  const members = project.members?.length ?? 1;
  const opened = project.lastOpenedAt ?? project.createdAt;
  return (
    <Card
      isPressable
      onPress={onOpen}
      className="group h-full w-full border border-divider bg-content1/80 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
    >
      {/* Colored strip in the project's language color */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${lang.color}, transparent)` }} />
      <CardBody className="flex flex-col gap-3 p-5 text-left">
        <div className="flex items-center gap-2 text-xs text-default-500">
          <span className="size-2 rounded-full" style={{ backgroundColor: lang.color }} />
          <span className="font-mono">{lang.file}</span>
          <Chip size="sm" variant="flat" color={isOwner ? "primary" : "default"} className="ml-auto">
            {isOwner ? "Owner" : "Shared with you"}
          </Chip>
        </div>
        <p className="font-display truncate text-lg font-semibold">{project.name}</p>
        <div className="flex items-center gap-3 text-xs text-default-400">
          <span className="flex items-center gap-1">
            <UsersIcon size={12} /> {members}/{project.teamSize ?? MAX_TEAM} members
          </span>
          <span>Opened {new Date(opened).toLocaleDateString()}</span>
          <ArrowRightIcon size={16} className="ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </CardBody>
    </Card>
  );
}
