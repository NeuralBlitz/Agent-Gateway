# Wget Skill

File downloading.

## Commands

### Download
```
/wget <url>
```
Download file.

### Download As
```
/wget -O <url> <filename>
```
Download to file.

### Directory
```
/wget -P <dir> <url>
```
Download to directory.

### Multiple
```
/wget -i <file> <urls>
```
Download from list.

### Recursive
```
/wget -r <url>
```
Recursive download.

### Mirror
```
/wget -m <url>
```
Mirror site.

### Continue
```
/wget -c <url>
```
Continue download.

### Background
```
/wget -b <url>
```
Background download.

### Limit Rate
```
/wget --limit-rate <rate> <url>
```
Limit download rate.

### Username/Password
```
/wget --user=<user> --password=<pass> <url>
```
Auth download.

### Quiet
```
/wget -q <url>
```
Quiet mode.

### Verbose
```
/wget -v <url>
```
Verbose output.

### Convert Links
```
/wget --convert-links <url>
```
Convert links.

### Spider
```
/wget --spider <url>
```
Spider mode.

## Examples

```
/wget https://example.com/file.zip
/wget -O output.html https://example.com
/wget -P /tmp/downloads https://example.com/file.zip
/wget -i urls.txt
/wget -r https://example.com
/wget -m https://example.com
/wget -c largefile.zip
/wget -b https://example.com/bigfile.zip
/wget --limit-rate=1M https://example.com/file.zip
/wget --user=admin --password=secret https://example.com
/wget -q https://example.com
/wget -v https://example.com
/wget --convert-links -r https://example.com
/wget --spider https://example.com
```
