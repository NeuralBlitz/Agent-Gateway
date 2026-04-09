---
name: powershell
description: PowerShell scripting and automation for Windows and cross-platform
category: systems-administration
difficulty: intermediate
tags: [powershell, scripting, automation, windows]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# PowerShell

## What I Do

I am PowerShell, Microsoft's command-line shell and scripting language built on .NET. I provide powerful automation capabilities across Windows, Linux, and macOS. I use a verb-noun naming convention for discoverable commands. I pipeline objects between commands, not text. I offer advanced scripting features including functions, modules, classes, and workflows. I integrate with COM, WMI, .NET, and REST APIs. My Just Enough Administration (JEA) enables role-based administration. I support Desired State Configuration (DSC) for declarative configuration management. I'm essential for Windows Server automation and cloud management with Azure PowerShell.

## When to Use Me

- Windows Server administration
- Active Directory management
- Cloud automation (Azure, AWS, GCP)
- Exchange/SharePoint administration
- Configuration management with DSC
- Log analysis and reporting
- CI/CD pipeline scripting
- Task automation and scheduling
- Exchange data protection

## Core Concepts

**Cmdlets**: Small, single-purpose commands following Verb-Noun convention.

**Pipeline**: Passing objects between commands for chained operations.

**Providers**: Access to different data stores (filesystem, registry, certificates).

**Modules**: Bundled cmdlets for specific functionality.

**DSC**: Desired State Configuration for declarative infrastructure.

**Remote PowerShell**: WS-Management for remote execution.

**Classes**: Custom types with properties and methods.

**Jobs**: Background tasks for parallel execution.

## Code Examples

### Example 1: Advanced Function Template
```powershell
function Invoke-SystemHealthCheck {
    <#
    .SYNOPSIS
        Performs comprehensive system health check
    
    .DESCRIPTION
        This function checks various system components and returns
        a health status report
    
    .PARAMETER ComputerName
        Target computer name(s)
    
    .PARAMETER Timeout
        Connection timeout in seconds
    
    .PARAMETER IncludeLogs
        Include event log analysis
    
    .EXAMPLE
        Invoke-SystemHealthCheck -ComputerName 'SERVER01'
    
    .EXAMPLE
        Invoke-SystemHealthCheck -ComputerName 'SERVER01','SERVER02' -IncludeLogs
    #>
    
    [CmdletBinding(
        SupportsShouldProcess=$true,
        ConfirmImpact='Low'
    )]
    param(
        [Parameter(
            Mandatory=$false,
            ValueFromPipeline=$true,
            ValueFromPipelineByPropertyName=$true
        )]
        [Alias('CN','Name','Server')]
        [string[]]$ComputerName = $env:COMPUTERNAME,
        
        [Parameter()]
        [int]$Timeout = 30,
        
        [Parameter()]
        [switch]$IncludeLogs,
        
        [Parameter()]
        [string]$OutputPath
    )
    
    begin {
        $results = @()
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        Write-Verbose "Starting health check at $(Get-Date)"
    }
    
    process {
        foreach ($computer in $ComputerName) {
            Write-Information "Processing $computer" -InformationAction Continue
            
            if ($PSCmdlet.ShouldProcess($computer, "Check system health")) {
                $computerResults = @{
                    ComputerName = $computer
                    CheckTime = Get-Date
                    Checks = @{}
                }
                
                # Check connectivity
                $computerResults.Checks['Connectivity'] = @{
                    Status = Test-Connection -ComputerName $computer -Count 1 -Quiet
                    Latency = (Measure-Command { Test-Connection -ComputerName $computer -Count 1 }).Milliseconds
                }
                
                # Check services
                if ($computer -eq $env:COMPUTERNAME -or (Test-WSMan $computer -ErrorAction SilentlyContinue)) {
                    $criticalServices = @('WinRM','Dhcp','Dns')
                    $computerResults.Checks['Services'] = foreach ($service in $criticalServices) {
                        $svc = Get-Service -Name $service -ComputerName $computer -ErrorAction SilentlyContinue
                        @{
                            Name = $service
                            Status = $svc?.Status ?? 'Unknown'
                            StartType = (Get-CimInstance -ClassName Win32_Service `
                                        -Filter "Name='$service'" `
                                        -ComputerName $computer -ErrorAction SilentlyContinue)?.StartMode
                        }
                    }
                    
                    # Check disk space
                    $computerResults.Checks['Disks'] = Get-CimInstance -ClassName Win32_LogicalDisk `
                        -ComputerName $computer -ErrorAction SilentlyContinue |
                        Where-Object {$_.DriveType -eq 3} |
                        ForEach-Object {
                            @{
                                Drive = $_.DeviceID
                                PercentFree = [math]::Round(($_.FreeSpace / $_.Size) * 100, 2)
                                Status = if ($_.FreeSpace / $_.Size -lt 0.1) { 'Critical' }
                                         elseif ($_.FreeSpace / $_.Size -lt 0.2) { 'Warning' }
                                         else { 'Healthy' }
                            }
                        }
                }
                
                # Event logs
                if ($IncludeLogs) {
                    $computerResults.Checks['EventLogs'] = @{
                        Errors = (Get-EventLog -LogName System -EntryType Error `
                                  -After (Get-Date).AddHours(-24) -ComputerName $computer -ErrorAction SilentlyContinue).Count
                        Warnings = (Get-EventLog -LogName System -EntryType Warning `
                                    -After (Get-Date).AddHours(-24) -ComputerName $computer -ErrorAction SilentlyContinue).Count
                    }
                }
                
                $results += [PSCustomObject]$computerResults
            }
        }
    }
    
    end {
        $stopwatch.Stop()
        Write-Verbose "Health check completed in $($stopwatch.Elapsed.TotalSeconds) seconds"
        
        # Output results
        $results |
            ForEach-Object {
                [PSCustomObject]@{
                    ComputerName = $_.ComputerName
                    OverallStatus = if ($_.Checks.Values.Status -contains 'Critical') { 'Critical' }
                                     elseif ($_.Checks.Values.Status -contains 'Warning') { 'Warning' }
                                     else { 'Healthy' }
                    Details = $_.Checks
                }
            }
        
        # Export to file
        if ($OutputPath) {
            $results | Export-Clixml -Path $OutputPath -Force
            Write-Verbose "Results exported to $OutputPath"
        }
    }
}
```

### Example 2: DSC Configuration
```powershell
configuration WebServerConfig {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$ComputerName,
        
        [Parameter(Mandatory=$true)]
        [string]$WebSiteName,
        
        [Parameter(Mandatory=$true)]
        [string]$PhysicalPath
    )
    
    Import-DscResource -ModuleName PSDesiredStateConfiguration
    Import-DscResource -ModuleName xWebAdministration
    
    node $ComputerName {
        # Install Web Server role
        WindowsFeature WebServer {
            Ensure = 'Present'
            Name = 'Web-Server'
        }
        
        # Install management tools
        WindowsFeature WebMgmtTools {
            Ensure = 'Present'
            Name = 'Web-Mgmt-Tools'
            DependsOn = '[WindowsFeature]WebServer'
        }
        
        # Create application pool
        xWebAppPool AppPool {
            Ensure = 'Present'
            Name = $WebSiteName
            State = 'Started'
            ManagedRuntimeVersion = 'v4.0'
            IdentityType = 'ApplicationPoolIdentity'
            DependsOn = '[WindowsFeature]WebMgmtTools'
        }
        
        # Create website
        xWebsite WebSite {
            Ensure = 'Present'
            Name = $WebSiteName
            State = 'Started'
            PhysicalPath = $PhysicalPath
            ApplicationPool = $WebSiteName
            BindingInfo = MSFT_xWebBindingInformation {
                Protocol = 'http'
                Port = 80
            }
            DependsOn = '[xWebAppPool]AppPool'
        }
        
        # Configure authentication
        xWebConfigProperty Authentication {
            WebsitePath = "IIS:\Sites\$WebSiteName"
            Filter = 'system.webServer/security/authentication/anonymousAuthentication'
            PropertyName = 'Enabled'
            Value = $false
            DependsOn = '[xWebsite]WebSite'
        }
        
        # Ensure SSL required
        xWebConfigProperty RequireSSL {
            WebsitePath = "IIS:\Sites\$WebSiteName"
            Filter = 'system.webServer/security/access'
            PropertyName = 'sslFlags'
            Value = 'Ssl'
            DependsOn = '[xWebsite]WebSite'
        }
        
        # Configure logging
        xWebsiteLogging Logging {
            Ensure = 'Present'
            Name = $WebSiteName
            LogDirectory = 'C:\inetpub\logs\LogFiles'
            LogFlags = @('Date','Time','ServerIP','Method','UriStem','Status','TimeTaken')
            DependsOn = '[xWebsite]WebSite'
        }
        
        # Windows Firewall
        Firewall AddFirewallRule {
            Ensure = 'Present'
            Name = "IIS-WebTraffic-HTTP-In"
            DisplayName = "IIS HTTP Traffic"
            Direction = 'Inbound'
            Protocol = 'tcp'
            LocalPort = 80
            Action = 'Allow'
            Enabled = 'True'
        }
    }
}

# Generate MOF files
WebServerConfig -ComputerName @('WEB01','WEB02') `
                -WebSiteName 'MyApplication' `
                -PhysicalPath 'D:\Websites\MyApplication'

# Apply configuration
Start-DscConfiguration -Path .\WebServerConfig -Wait -Verbose -Force
```

### Example 3: REST API Client
```powershell
class APIClient {
    [string]$BaseUri
    [hashtable]$Headers
    [int]$Timeout
    [bool]$IgnoreSSL
    
    APIClient([string]$BaseUri, [int]$Timeout = 30) {
        $this.BaseUri = $BaseUri
        $this.Timeout = $Timeout
        $this.Headers = @{
            'Content-Type' = 'application/json'
            'Accept' = 'application/json'
        }
    }
    
    [void] SetBearerToken([string]$Token) {
        $this.Headers['Authorization'] = "Bearer $Token"
    }
    
    [object] Get([string]$Endpoint, [hashtable]$QueryParams = @{}) {
        $uri = "$($this.BaseUri)/$Endpoint"
        if ($QueryParams.Count -gt 0) {
            $uri += '?' + ($QueryParams.GetEnumerator() | 
                ForEach-Object { "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))" }) -join '&'
        }
        
        $params = @{
            Uri = $uri
            Method = 'GET'
            Headers = $this.Headers
            Timeout = $this.Timeout
        }
        
        return $this.Invoke-RestMethod @params
    }
    
    [object] Post([string]$Endpoint, [object]$Body) {
        $uri = "$($this.BaseUri)/$Endpoint"
        $params = @{
            Uri = $uri
            Method = 'POST'
            Headers = $this.Headers
            Body = $Body | ConvertTo-Json -Depth 10
            Timeout = $this.Timeout
        }
        
        return $this.Invoke-RestMethod @params
    }
    
    [object] Put([string]$Endpoint, [object]$Body) {
        $uri = "$($this.BaseUri)/$Endpoint"
        $params = @{
            Uri = $uri
            Method = 'PUT'
            Headers = $this.Headers
            Body = $Body | ConvertTo-Json -Depth 10
            Timeout = $this.Timeout
        }
        
        return $this.Invoke-RestMethod @params
    }
    
    [object] Patch([string]$Endpoint, [object]$Body) {
        $uri = "$($this.BaseUri)/$Endpoint"
        $params = @{
            Uri = $uri
            Method = 'PATCH'
            Headers = $this.Headers
            Body = $Body | ConvertTo-Json -Depth 10
            Timeout = $this.Timeout
        }
        
        return $this.Invoke-RestMethod @params
    }
    
    [void] Delete([string]$Endpoint) {
        $uri = "$($this.BaseUri)/$Endpoint"
        $params = @{
            Uri = $uri
            Method = 'DELETE'
            Headers = $this.Headers
            Timeout = $this.Timeout
        }
        
        $null = Invoke-RestMethod @params
    }
}

# Usage example
$api = [APIClient]::new('https://api.example.com/v1')
$api.SetBearerToken('your-token-here')

# GET request
$users = $api.Get('users')

# POST request
$newUser = @{
    name = 'John Doe'
    email = 'john@example.com'
    role = 'admin'
}
$created = $api.Post('users', $newUser)
```

### Example 4: Parallel Processing with Jobs
```powershell
function Invoke-ParallelProcessing {
    <#
    .SYNOPSIS
        Process items in parallel using jobs
    #>
    param(
        [Parameter(Mandatory=$true)]
        [array]$InputObject,
        
        [Parameter(Mandatory=$true)]
        [scriptblock]$ScriptBlock,
        
        [Parameter()]
        [int]$ThrottleLimit = 5,
        
        [Parameter()]
        [string]$PropertyName
    )
    
    $results = @()
    $jobs = @()
    
    foreach ($item in $InputObject) {
        $job = @{
            ScriptBlock = $ScriptBlock
            InputObject = $item
        }
        
        if ($PropertyName) {
            $job['Name'] = $item.$PropertyName
        }
        
        $jobs += $job
        
        # Start job when throttle limit not reached
        if ($jobs.Count -ge $ThrottleLimit) {
            $results += Receive-Job -Job ($jobs | Start-Job -ScriptBlock $ScriptBlock) -ErrorAction Continue
            $jobs = @()
        }
    }
    
    # Process remaining jobs
    if ($jobs.Count -gt 0) {
        $results += Receive-Job -Job ($jobs | Start-Job -ScriptBlock $ScriptBlock) -ErrorAction Continue
    }
    
    return $results
}

# Example usage - process multiple servers
$servers = @('SERVER01','SERVER02','SERVER03','SERVER04','SERVER05')
$script = {
    param($server)
    Get-CimInstance -ComputerName $server -ClassName Win32_OperatingSystem |
        Select-Object @{N='Server';E={$server}}, Caption, Version
}

$results = Invoke-ParallelProcessing -InputObject $servers -ScriptBlock $script -ThrottleLimit 3
```

## Best Practices

- Use approved verbs: Get, Set, New, Remove, Invoke, Test
- Write advanced functions with full parameter binding
- Use ShouldProcess for destructive operations
- Implement Write-Verbose, Write-Error, Write-Warning
- Use strict mode: Set-StrictMode -Version Latest
- Prefer native cmdlets over external commands
- Use splatting for readability with many parameters
- Implement error handling with Try/Catch
- Use approved verbs and singular nouns
- Write comprehensive comment-based help

## Core Competencies

- Advanced function development
- PowerShell pipeline mastery
- Module creation and import
- DSC configuration
- Remote PowerShell (WSMan)
- REST API consumption
- Background jobs
- CIM/WMI integration
- .NET class usage
- Security best practices
- Performance optimization
- Cross-platform support
- Desired State Configuration
- Just Enough Administration (JEA)
