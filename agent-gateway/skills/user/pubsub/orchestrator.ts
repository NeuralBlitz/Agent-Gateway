import { SubstrateConnection } from "./mcp/client.js";
import * as yaml from "js-yaml";
import * as fs from "fs";

export interface SubagentDef {
    name: string;
    description: string;
    model: string;
    usos_capabilities: string[];
}

export class SubagentOrchestrator {
    private substrate: SubstrateConnection;
    private agents: Map<string, SubagentDef> = new Map();

    constructor(substrate: SubstrateConnection) {
        this.substrate = substrate;
    }

    public loadAgentDef(yamlPath: string) {
        const fileContents = fs.readFileSync(yamlPath, 'utf8');
        const data = yaml.load(fileContents) as any;
        
        for (const [key, def] of Object.entries(data)) {
            this.agents.set(key, def as SubagentDef);
            console.log(`   [+] Loaded Agent Definition: ${(def as SubagentDef).name}`);
        }
    }

    public async routeTask(agentId: string, taskPrompt: string) {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found.`);

        console.log(`\n🧠 Routing task to [${agent.name}] using model [${agent.model}]...`);
        
        const primaryCap = agent.usos_capabilities[0] || "process:spawn";
        
        console.log(`   [!] Agent requesting Substrate execution with capability: ${primaryCap}`);
        
        const response = await this.substrate.executeOsTask(
            taskPrompt,
            agent.name.includes("Shannon") ? "Security" : "Coding",
            primaryCap
        );

        return response;
    }

    public listAgents() {
        return Array.from(this.agents.entries());
    }
}
