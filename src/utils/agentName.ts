import { useState } from "react";

const AGENT_NAME_KEY = "agentName";

export const getAgentName = (): string => {
  return localStorage.getItem(AGENT_NAME_KEY) || "Agent";
};

export const setAgentName = (name: string): void => {
  localStorage.setItem(AGENT_NAME_KEY, name);
};

export const clearAgentName = (): void => {
  localStorage.removeItem(AGENT_NAME_KEY);
};

export const useAgentName = () => {
  const [agentName, setAgentNameState] = useState<string>(getAgentName());

  const updateAgentName = (name: string) => {
    setAgentName(name);
    setAgentNameState(name);
  };

  return { agentName, setAgentName: updateAgentName };
};
