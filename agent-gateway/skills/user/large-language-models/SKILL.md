---
name: large-language-models
description: Large language models
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Work with large language models
- Implement prompt engineering
- Fine-tune LLM models
- Build RAG systems
- Optimize LLM inference
- Handle LLM hallucination

## When to use me

Use me when:
- Building LLM-powered applications
- Implementing chatbots
- Creating text generation systems
- Knowledge-intensive question answering
- Text classification with LLMs

## Key Concepts

### LLM Architecture
- **Transformer**: Self-attention based
- **Encoder-only**: BERT, RoBERTa
- **Decoder-only**: GPT, LLaMA, Mistral
- **Encoder-decoder**: T5, BART

### Prompt Engineering
```python
# Few-shot prompting
prompt = """Classify the sentiment as POSITIVE, NEGATIVE, or NEUTRAL.

Text: This product is amazing!
Sentiment: POSITIVE

Text: Terrible experience, would not recommend.
Sentiment: NEGATIVE

Text: It was okay, nothing special.
Sentiment: NEUTRAL

Text: I absolutely love this!
Sentiment:"""

# Chain-of-thought
cot_prompt = """Solve the problem step by step.

Problem: If there are 5 birds and you shoot 2, how many remain?
Solution: First, 5 - 2 = 3. Then, the remaining birds fly away because of the noise, so 0 remain. Answer: 0

Problem: John has 3 apples. He buys 5 more. Then he eats 2. How many?
Solution:"""
```

### Fine-tuning
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType

# LoRA fine-tuning
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b")

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

model = get_peft_model(model, lora_config)
# Fine-tune on custom dataset
```

### RAG (Retrieval-Augmented Generation)
```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# Build retriever
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents, embeddings)
retriever = vectorstore.as_retriever()

# Create QA chain
qa = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    chain_type="stuff",
    retriever=retriever
)

answer = qa.run(query)
```

### Challenges
- Hallucination
- Context length limits
- Token costs
- Latency
- Bias and safety
