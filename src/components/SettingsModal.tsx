import React from "react";
import { Settings, Mic, Brain, User, Sparkles, Book } from "lucide-react";
import SidebarModal, { SidebarItem } from "./ui/SidebarModal";
import SettingsPage, { SettingsSectionType } from "./SettingsPage";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({
  open,
  onOpenChange,
}: SettingsModalProps) {
  const sidebarItems: SidebarItem<SettingsSectionType>[] = [
    { id: "general", label: "Général", icon: Settings },
    { id: "transcription", label: "Mode de transcription", icon: Mic },
    { id: "dictionary", label: "Dictionnaire", icon: Book },
    { id: "aiModels", label: "Modèles IA", icon: Brain },
    { id: "agentConfig", label: "Configuration de l'agent", icon: User },
    { id: "prompts", label: "Invites IA", icon: Sparkles },
  ];

  const [activeSection, setActiveSection] =
    React.useState<SettingsSectionType>("general");

  return (
    <SidebarModal<SettingsSectionType>
      open={open}
      onOpenChange={onOpenChange}
      title="Paramètres"
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <SettingsPage activeSection={activeSection} />
    </SidebarModal>
  );
}
