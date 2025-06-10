import { v2 } from "@google-cloud/dialogflow";

const agentsClient = new v2.AgentsClient();
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = "global"; // or your Dialogflow location, e.g. "us-central1"
const parentBase = `projects/${projectId}/locations/${location}`;

/**
 * Get the agent for the project
 * @returns {Promise<Object>} Dialogflow Agent object
 */
export async function getAgent() {
  const request = { parent: `projects/${projectId}` };
  const [agent] = await agentsClient.getAgent(request);
  return agent;
}

/**
 * Create or update the agent
 * @param {Object} agentPayload - The agent configuration to set
 * @returns {Promise<Object>} The created or updated agent object
 */
export async function setAgent(agentPayload) {
  // Dialogflow uses "setAgent" to create or update
  const request = {
    agent: {
      parent: `projects/${projectId}`,
      ...agentPayload,
    },
  };
  const [agent] = await agentsClient.setAgent(request);
  return agent;
}

/**
 * Delete the agent (note: Dialogflow API does not support deleting agent directly)
 * Instead, you can clear/reset agent config via setAgent with empty values
 * @returns {Promise<void>}
 */
export async function deleteAgent() {
  // No direct delete API; you can reset agent by setting empty config if needed
  const emptyAgent = {
    parent: `projects/${projectId}`,
    displayName: "",
    defaultLanguageCode: "",
    timeZone: "",
    description: "",
    avatarUri: "",
    enableLogging: false,
  };

  await agentsClient.setAgent({ agent: emptyAgent });
}

/**
 * Search agents (list agents) - Only available on locations that support multiple agents
 * This is a bit tricky because usually a project only has one agent.
 * But you can list agents if supported via locations API
 */
export async function listAgents() {
  // Not commonly used; usually 1 agent per project
  const request = {
    parent: parentBase,
  };
  const [response] = await agentsClient.searchAgents(request);
  return response.agents || [];
}
