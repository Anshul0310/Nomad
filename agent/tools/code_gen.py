"""
Code Generation Tool — Generate code snippets and solutions.

The Nomad AI can write code in any language, from smart contracts
to web apps to scripts. This is its most premium service.
"""

import json
from agent import config


SYSTEM_PROMPT = """You are an expert software engineer. Generate clean, production-quality code based on the user's request.
Return ONLY a JSON object with this structure:
{"language":"python","title":"Brief title","code":"the actual code here","explanation":"brief explanation of what the code does","complexity":"simple|medium|complex"}

Rules:
- Write clean, well-commented code
- Use modern best practices
- Keep the code concise but complete
- Return ONLY valid JSON, no markdown fences"""


def generate_code(
    prompt: str = "Write a hello world program",
    language: str = "python",
    context: str = "",
) -> dict:
    """Generate code based on a prompt."""
    user_msg = f"Write {language} code: {prompt}"
    if context:
        user_msg += f"\nAdditional context: {context}"

    try:
        raw = config.llm_call(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=800,
            temperature=0.2,
        )

        # Extract JSON from response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]

        result = json.loads(raw)
        result["service_type"] = "code_generation"
        result["price_sol"] = config.DEFAULT_PRICES.get("code_generation", 0.10)
        return result

    except Exception as e:
        # Fallback demo response
        demo_code = _demo_code(language, prompt)
        return {
            "language": language,
            "title": f"{language.title()} code for: {prompt[:50]}",
            "code": demo_code,
            "explanation": f"Generated {language} code based on the request.",
            "complexity": "medium",
            "service_type": "code_generation",
            "price_sol": config.DEFAULT_PRICES.get("code_generation", 0.10),
            "fallback": True,
        }


def _demo_code(language: str, prompt: str) -> str:
    """Fallback demo code when LLM is unavailable."""
    demos = {
        "python": '''def solve(data):
    """Auto-generated solution by Nomad AI."""
    results = []
    for item in data:
        processed = item.strip().lower()
        if processed:
            results.append(processed)
    return sorted(set(results))

# Usage
if __name__ == "__main__":
    sample = ["Hello", "World", "hello", "WORLD"]
    print(solve(sample))  # ['hello', 'world']''',
        "javascript": '''/**
 * Auto-generated solution by Nomad AI.
 */
function solve(data) {
  return [...new Set(
    data
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)
  )].sort();
}

// Usage
console.log(solve(["Hello", "World", "hello"]));''',
        "rust": '''/// Auto-generated solution by Nomad AI.
fn solve(data: &[&str]) -> Vec<String> {
    let mut results: Vec<String> = data
        .iter()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect();
    results.sort();
    results.dedup();
    results
}

fn main() {
    let data = vec!["Hello", "World", "hello"];
    println!("{:?}", solve(&data));
}''',
        "solidity": '''// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Auto-generated contract by Nomad AI
contract NomadGenerated {
    mapping(address => uint256) public balances;
    
    event Deposited(address indexed user, uint256 amount);
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}''',
    }
    return demos.get(language, demos["python"])
