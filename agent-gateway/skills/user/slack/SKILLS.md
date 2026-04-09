# Slack Skill

Slack integration and messaging.

## Commands

### Send Message
```
/slack send <channel> <message>
```
Send message to channel.

### Send DM
```
/slack dm <user> <message>
```
Send direct message.

### Send File
```
/slack file <channel> <file>
```
Upload file to channel.

### List Channels
```
/slack channels
```
List Slack channels.

### User Info
```
/slack user <username>
```
Get user information.

### Create Channel
```
/slack create-channel <name>
```
Create new channel.

### Archive Channel
```
/slack archive <channel>
```
Archive channel.

## Examples

```
/slack send "#general" "Deployment complete!"
/slack dm "john" "Task assigned to you"
/slack file "#logs" error.log
/slack channels
/slack user john
/slack create-channel project-updates
```
