# Notion Skill

Notion workspace management.

## Commands

### List Pages
```
/notion pages
```
List all pages.

### Get Page
```
/notion get <page-id>
```
Get page content.

### Create Page
```
/notion create <title> [parent]
```
Create new page.

### Update Page
```
/notion update <page-id> <content>
```
Update page content.

### Create Database
```
/notion create-db <title> <properties>
```
Create database.

### Query Database
```
/notion query <database-id>
```
Query database.

### Add to Database
```
/notion add <database-id> <properties>
```
Add entry to database.

### Update Entry
```
/notion update-entry <entry-id> <properties>
```
Update database entry.

### Delete
```
/notion delete <page-id>
```
Delete page or entry.

### Search
```
/notion search <query>
```
Search workspace.

### Share Page
```
/notion share <page-id> <email>
```
Share page with user.

### Archive
```
/notion archive <page-id>
```
Archive page.

### List Databases
```
/notion databases
```
List all databases.

## Examples

```
/notion pages
/notion get abc123
/notion create "Meeting Notes"
/notion create-db "Tasks" '{"Status": "select", "Priority": "select"}'
/notion query database-id
/notion add database-id '{"Name": "Task 1"}'
/notion search "project"
/notion databases
```
