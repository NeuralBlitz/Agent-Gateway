---
name: serverside-rendering
description: Server-side rendering for improved performance and SEO
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: web-development
---
## What I do
- Render React/Vue on the server
- Handle SSR with hydration
- Manage server state
- Implement streaming SSR
- Handle SEO requirements

## When to use me
When building SEO-sensitive or performance-critical apps.

## Next.js SSR
```javascript
// pages/index.js
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return <div>{data.title}</div>;
}
```
