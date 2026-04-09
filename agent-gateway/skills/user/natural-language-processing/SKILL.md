---
name: natural-language-processing
description: NLP text processing and analysis
license: MIT
compatibility: opencode
metadata:
  audience: machine-learning-engineers
  category: artificial-intelligence
---

## What I do

- Process and analyze text data
- Build text classification models
- Extract entities and features from text
- Implement language models
- Create text embeddings
- Build language understanding systems
- Work with multilingual text

## When to use me

Use me when:
- Building text classification systems
- Extracting information from documents
- Creating chatbots or virtual assistants
- Analyzing sentiment in text
- Working with large language models
- Processing multilingual data

## Key Concepts

### Text Preprocessing
```python
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def preprocess_text(text):
    # Lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+', '', text)
    
    # Remove special chars, keep letters
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    tokens = [t for t in tokens if t not in stop_words]
    
    # Lemmatize
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(t) for t in tokens]
    
    return ' '.join(tokens)

# Apply
df['processed_text'] = df['raw_text'].apply(preprocess_text)
```

### Text Vectorization
```python
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# TF-IDF
tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
X_tfidf = tfidf.fit_transform(texts)

# Count (for LDA)
count_vec = CountVectorizer(max_features=5000)
X_count = count_vec.fit_transform(texts)

# LDA for topic modeling
lda = LatentDirichletAllocation(n_components=10)
topics = lda.fit_transform(X_count)
```

### Transformer Models
```python
from transformers import pipeline, AutoTokenizer, AutoModel

# Pre-trained sentiment
sentiment = pipeline("sentiment-analysis")
result = sentiment("This product is amazing!")

# Named Entity Recognition
ner = pipeline("ner", entity="ORGANIZATION")
entities = ner("Apple Inc. is headquartered in Cupertino")

# Text generation
generator = pipeline("text-generation", model="gpt2")
output = generator("Once upon a time", max_length=50)
```

### Common NLP Tasks
- **Classification**: Spam detection, sentiment
- **NER**: Named entity extraction
- **Translation**: Language conversion
- **Summarization**: Abstractive/Extractive
- **QA**: Question answering
- **Chatbots**: Conversational AI
