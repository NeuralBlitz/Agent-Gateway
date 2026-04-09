# Text Skill

Text processing and manipulation.

## Commands

### Replace
```
/text replace <file> <from> <to>
```
Replace text in file.

### Search
```
/text search <pattern> [path]
```
Search for pattern in files.

### Count
```
/text count <pattern> [path]
```
Count occurrences.

### Extract
```
/text extract <file> <pattern>
```
Extract matches from text.

### Sort
```
/text sort <file>
```
Sort lines alphabetically.

### Unique
```
/text unique <file>
```
Remove duplicate lines.

### Uppercase
```
/text upper <file>
```
Convert to uppercase.

### Lowercase
```
/text lower <file>
```
Convert to lowercase.

### Trim
```
/text trim <file>
```
Remove leading/trailing whitespace.

### Join Lines
```
/text join <file>
```
Join lines into single string.

### Split
```
/text split <file> <delimiter>
```
Split by delimiter.

### JSON Format
```
/text json-format <file>
```
Pretty print JSON.

## Examples

```
/text replace config.ini "old" "new"
/text search "function" src/
/text count "TODO" *.py
/text extract log.txt "ERROR.*"
/text sort names.txt
/text unique duplicates.txt
/text upper title.txt
/text lower Title.TXT
/text trim messy.txt
/text json-format data.json
```
