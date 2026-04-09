# Cross-Domain Skill Synthesizer v1.0
# Enables multi-domain skill fusion and synthesis up to 7 domains

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple, Any
from enum import Enum
from collections import defaultdict
import json
import hashlib


class FusionMode(Enum):
    """Mode of skill fusion."""

    SEQUENTIAL = "sequential"  # Chain skills in sequence
    PARALLEL = "parallel"  # Run skills concurrently
    HIERARCHICAL = "hierarchical"  # Nested skill composition
    EMERGENT = "emergent"  # New properties emerge from combination


class Domain(Enum):
    """Core domains for skill synthesis."""

    PROGRAMMING = "programming"
    INFRASTRUCTURE = "infrastructure"
    DATA = "data"
    ARCHITECTURE = "architecture"
    SECURITY = "security"
    DEVOPS = "devops"
    CLOUD = "cloud"


@dataclass
class SkillNode:
    """A single skill node in the synthesis graph."""

    name: str
    domain: Domain
    capabilities: List[str]
    dependencies: List[str] = field(default_factory=list)
    weight: float = 1.0
    version: str = "1.0.0"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "domain": self.domain.value,
            "capabilities": self.capabilities,
            "dependencies": self.dependencies,
            "weight": self.weight,
            "version": self.version,
        }


@dataclass
class SkillBridge:
    """Bridge between two or more domains."""

    name: str
    source_domains: List[Domain]
    target_domain: Domain
    synthesis_type: str
    confidence: float
    bridge_skills: List[SkillNode]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "sources": [d.value for d in self.source_domains],
            "target": self.target_domain.value,
            "synthesis": self.synthesis_type,
            "confidence": self.confidence,
            "skills": [s.name for s in self.bridge_skills],
        }


@dataclass
class SynthesisResult:
    """Result of skill synthesis operation."""

    synthesized_skill: str
    source_domains: List[Domain]
    fusion_mode: FusionMode
    confidence: float
    capabilities: List[str]
    emergent_properties: List[str]
    synthesis_graph: dict
    cross_references: List[dict]
    version: str = "1.0.0"

    def to_dict(self) -> dict:
        return {
            "skill": self.synthesized_skill,
            "domains": [d.value for d in self.source_domains],
            "mode": self.fusion_mode.value,
            "confidence": self.confidence,
            "capabilities": self.capabilities,
            "emergent": self.emergent_properties,
            "graph": self.synthesis_graph,
            "cross_refs": self.cross_references,
            "version": self.version,
        }


class CrossDomainSynthesizer:
    """
    Main synthesizer for cross-domain skill fusion.
    Synthesizes skills from up to 7 domains.
    """

    def __init__(self, protocol_config: dict = None):
        self.domains = self._load_domains(protocol_config)
        self.skill_graph = defaultdict(list)
        self.bridges: List[SkillBridge] = []
        self.synthesis_history: List[SynthesisResult] = []

        # Initialize domain capabilities matrix
        self.capability_matrix = self._build_capability_matrix()

    def _load_domains(self, config: dict) -> Dict[Domain, dict]:
        """Load domain configurations."""
        default_domains = {
            Domain.PROGRAMMING: {
                "capabilities": [
                    "code_synthesis",
                    "algorithm_design",
                    "debugging",
                    "refactoring",
                ],
                "weight": 1.0,
            },
            Domain.INFRASTRUCTURE: {
                "capabilities": ["deployment", "scaling", "monitoring", "security"],
                "weight": 1.0,
            },
            Domain.DATA: {
                "capabilities": ["storage", "processing", "analytics", "pipelines"],
                "weight": 1.0,
            },
            Domain.ARCHITECTURE: {
                "capabilities": [
                    "design_patterns",
                    "system_design",
                    "integration",
                    "scalability",
                ],
                "weight": 1.0,
            },
            Domain.SECURITY: {
                "capabilities": [
                    "authentication",
                    "authorization",
                    "encryption",
                    "compliance",
                ],
                "weight": 1.0,
            },
            Domain.DEVOPS: {
                "capabilities": ["ci_cd", "automation", "testing", "monitoring"],
                "weight": 1.0,
            },
            Domain.CLOUD: {
                "capabilities": [
                    "cloud_services",
                    "serverless",
                    "containers",
                    "networking",
                ],
                "weight": 1.0,
            },
        }

        if config and "domains" in config:
            for domain_config in config["domains"]:
                domain = Domain(domain_config["name"])
                if domain in default_domains:
                    default_domains[domain].update(domain_config)

        return default_domains

    def _build_capability_matrix(self) -> dict:
        """Build capability overlap matrix."""
        matrix = {}
        domains = list(self.domains.keys())

        for i, d1 in enumerate(domains):
            for d2 in domains[i + 1 :]:
                cap1 = set(self.domains[d1]["capabilities"])
                cap2 = set(self.domains[d2]["capabilities"])
                overlap = cap1.intersection(cap2)
                matrix[(d1, d2)] = len(overlap) / len(cap1.union(cap2))

        return matrix

    def register_skill(self, skill: SkillNode) -> None:
        """Register a skill in the synthesis graph."""
        self.skill_graph[skill.domain].append(skill)

    def create_bridge(
        self,
        name: str,
        source_domains: List[Domain],
        target_domain: Domain,
        synthesis_type: str,
    ) -> SkillBridge:
        """Create a bridge between domains."""
        # Gather skills from source domains
        bridge_skills = []
        for domain in source_domains:
            bridge_skills.extend(self.skill_graph[domain])

        # Calculate confidence based on overlap
        confidence = self._calculate_bridge_confidence(source_domains, target_domain)

        bridge = SkillBridge(
            name=name,
            source_domains=source_domains,
            target_domain=target_domain,
            synthesis_type=synthesis_type,
            confidence=confidence,
            bridge_skills=bridge_skills,
        )

        self.bridges.append(bridge)
        return bridge

    def _calculate_bridge_confidence(
        self, sources: List[Domain], target: Domain
    ) -> float:
        """Calculate confidence for a domain bridge."""
        if len(sources) < 2:
            return 0.5

        overlap_scores = []
        for source in sources:
            key = (
                (source, target) if (source, target) in self.capability_matrix else None
            )
            if key and key in self.capability_matrix:
                overlap_scores.append(self.capability_matrix[key])

        if overlap_scores:
            return sum(overlap_scores) / len(overlap_scores)
        return 0.3

    def synthesize(
        self,
        skill_name: str,
        domains: List[Domain],
        mode: FusionMode = FusionMode.HIERARCHICAL,
        requirements: List[str] = None,
    ) -> SynthesisResult:
        """
        Synthesize a new skill from multiple domains.
        Supports synthesis of up to 7 domains.
        """
        if len(domains) > 7:
            raise ValueError("Maximum 7 domains can be synthesized")

        # Gather capabilities from all domains
        all_capabilities = []
        domain_capabilities = {}

        for domain in domains:
            caps = self.domains[domain]["capabilities"]
            domain_capabilities[domain] = caps
            all_capabilities.extend(caps)

        # Remove duplicates while preserving order
        unique_capabilities = list(dict.fromkeys(all_capabilities))

        # Calculate emergent properties
        emergent = self._identify_emergent_properties(domains, unique_capabilities)

        # Generate synthesis graph
        graph = self._build_synthesis_graph(
            skill_name, domains, domain_capabilities, mode
        )

        # Create cross-references
        cross_refs = self._generate_cross_references(domains)

        # Calculate overall confidence
        confidence = self._calculate_synthesis_confidence(
            domains, emergent, len(unique_capabilities)
        )

        result = SynthesisResult(
            synthesized_skill=skill_name,
            source_domains=domains,
            fusion_mode=mode,
            confidence=confidence,
            capabilities=unique_capabilities,
            emergent_properties=emergent,
            synthesis_graph=graph,
            cross_references=cross_refs,
        )

        self.synthesis_history.append(result)
        return result

    def _identify_emergent_properties(
        self, domains: List[Domain], capabilities: List[str]
    ) -> List[str]:
        """Identify emergent properties from domain combinations."""
        emergent = []

        # Check for specific domain combinations
        domain_set = set(domains)

        # Programming + Security = Secure Coding
        if Domain.PROGRAMMING in domain_set and Domain.SECURITY in domain_set:
            emergent.extend(
                ["threat_modeling", "secure_design", "vulnerability_assessment"]
            )

        # Architecture + Data = System Design
        if Domain.ARCHITECTURE in domain_set and Domain.DATA in domain_set:
            emergent.extend(
                ["distributed_systems", "data_consistency", "scalable_architecture"]
            )

        # Cloud + DevOps = Platform Engineering
        if Domain.CLOUD in domain_set and Domain.DEVOPS in domain_set:
            emergent.extend(["infrastructure_as_code", "auto_scaling", "observability"])

        # All 7 domains = Full-Stack Engineering
        if len(domain_set) >= 6:
            emergent.extend(
                [
                    "end_to_end_ownership",
                    "polyglot_development",
                    "holistic_system_understanding",
                ]
            )

        return list(set(emergent))

    def _build_synthesis_graph(
        self,
        skill_name: str,
        domains: List[Domain],
        domain_capabilities: Dict[Domain, List[str]],
        mode: FusionMode,
    ) -> dict:
        """Build a graph representation of the synthesis."""
        nodes = []
        edges = []

        # Add domain nodes
        for domain in domains:
            nodes.append(
                {
                    "id": domain.value,
                    "type": "domain",
                    "label": domain.value,
                    "capabilities": domain_capabilities[domain],
                }
            )

        # Add skill node
        nodes.append(
            {
                "id": skill_name,
                "type": "synthesized_skill",
                "label": skill_name,
                "mode": mode.value,
            }
        )

        # Add edges based on fusion mode
        for domain in domains:
            edge_type = {
                FusionMode.SEQUENTIAL: "sequential",
                FusionMode.PARALLEL: "parallel",
                FusionMode.HIERARCHICAL: "hierarchical",
                FusionMode.EMERGENT: "emergent",
            }[mode]

            edges.append(
                {
                    "from": domain.value,
                    "to": skill_name,
                    "type": edge_type,
                    "weight": self.domains[domain]["weight"],
                }
            )

        return {"nodes": nodes, "edges": edges}

    def _generate_cross_references(self, domains: List[Domain]) -> List[dict]:
        """Generate cross-references between domains."""
        refs = []

        for i, d1 in enumerate(domains):
            for d2 in domains[i + 1 :]:
                overlap_key = (d1, d2)
                if overlap_key in self.capability_matrix:
                    refs.append(
                        {
                            "source": d1.value,
                            "target": d2.value,
                            "overlap_score": self.capability_matrix[overlap_key],
                            "bridge_type": self._get_bridge_type(d1, d2),
                        }
                    )

        return refs

    def _get_bridge_type(self, d1: Domain, d2: Domain) -> str:
        """Determine the type of bridge between two domains."""
        bridges = {
            (Domain.PROGRAMMING, Domain.DEVOPS): "platform_development",
            (Domain.DATA, Domain.CLOUD): "cloud_data_systems",
            (Domain.SECURITY, Domain.CLOUD): "cloud_security",
            (Domain.ARCHITECTURE, Domain.DEVOPS): "infrastructure_architecture",
        }

        key = (d1, d2) if (d1, d2) in bridges else (d2, d1)
        return bridges.get(key, "generic_bridge")

    def _calculate_synthesis_confidence(
        self, domains: List[Domain], emergent: List[str], num_capabilities: int
    ) -> float:
        """Calculate overall synthesis confidence."""
        # Base confidence from domain compatibility
        domain_confidence = 0.5

        for i, d1 in enumerate(domains):
            for d2 in domains[i + 1 :]:
                key = (d1, d2)
                if key in self.capability_matrix:
                    domain_confidence += self.capability_matrix[key]

        if len(domains) > 1:
            domain_confidence /= len(domains) * (len(domains) - 1) / 2

        # Bonus for emergent properties
        emergent_bonus = min(len(emergent) * 0.05, 0.2)

        # Bonus for capability coverage
        coverage_bonus = min(num_capabilities / 10 * 0.1, 0.3)

        return min(domain_confidence + emergent_bonus + coverage_bonus, 1.0)

    def get_synthesis_manifest(self) -> dict:
        """Generate a manifest of all possible syntheses."""
        manifest = {
            "available_domains": [d.value for d in self.domains.keys()],
            "registered_skills": {
                d.value: [s.name for s in skills]
                for d, skills in self.skill_graph.items()
            },
            "active_bridges": [b.to_dict() for b in self.bridges],
            "synthesis_history_count": len(self.synthesis_history),
            "possible_syntheses": self._list_possible_syntheses(),
        }
        return manifest

    def _list_possible_syntheses(self) -> List[dict]:
        """List all possible domain syntheses."""
        possible = []

        # Two-domain syntheses
        domains = list(self.domains.keys())
        for i, d1 in enumerate(domains):
            for d2 in domains[i + 1 :]:
                possible.append(
                    {
                        "domains": [d1.value, d2.value],
                        "max_fusion": "emergent",
                        "min_confidence": self._calculate_bridge_confidence([d1], d2),
                    }
                )

        return possible

    def export_protocol(self) -> dict:
        """Export the full protocol definition."""
        return {
            "version": "1.0.0",
            "domains": {d.value: info for d, info in self.domains.items()},
            "bridges": [b.to_dict() for b in self.bridges],
            "synthesis_history": [r.to_dict() for r in self.synthesis_history[-10:]],
            "manifest": self.get_synthesis_manifest(),
        }


# Quick synthesis function for common patterns
def quick_synthesize(domains: List[str], skill_name: str = None) -> dict:
    """Quickly synthesize a skill from domain names."""
    domain_enums = [Domain(d) for d in domains]
    synthesizer = CrossDomainSynthesizer()

    name = skill_name or "_".join(domains) + "_synthesis"

    result = synthesizer.synthesize(name, domain_enums)

    return {
        "skill": result.synthesized_skill,
        "domains": domains,
        "capabilities": result.capabilities,
        "emergent": result.emergent_properties,
        "confidence": result.confidence,
    }


# Example usage
if __name__ == "__main__":
    # Create synthesizer
    synth = CrossDomainSynthesizer()

    # Synthesize "platform_engineering" from programming + cloud
    result = synth.synthesize(
        "platform_engineering",
        [Domain.PROGRAMMING, Domain.CLOUD, Domain.DEVOPS],
        mode=FusionMode.EMERGENT,
    )

    print(f"Synthesized: {result.synthesized_skill}")
    print(f"Domains: {[d.value for d in result.source_domains]}")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Capabilities: {result.capabilities}")
    print(f"Emergent Properties: {result.emergent_properties}")
