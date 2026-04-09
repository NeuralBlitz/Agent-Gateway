---
name: static-site-generators
description: Static site generators for building fast, secure websites
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: web-development
---
## What I do
- Build static sites from templates
- Use Markdown/MDX content
- Generate optimized assets
- Implement theming

## When to use me
When building blogs, documentation, or marketing sites.

## Hugo Example
```yaml
# config.yaml
baseURL: "https://example.org/"
languageCode: "en-us"
title: "My Site"

# content/posts/hello.md
---
title: "Hello World"
date: 2024-01-01
---
# Hello
Content here.
```

## Eleventy
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css/");
  
  return {
    dir: { input: "src", output: "_site" }
  };
};
```
