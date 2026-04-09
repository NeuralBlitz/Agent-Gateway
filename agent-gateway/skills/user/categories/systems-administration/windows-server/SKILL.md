---
name: windows-server
description: Windows Server administration and PowerShell automation
category: systems-administration
difficulty: intermediate
tags: [windows, server, active-directory, powershell]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# Windows Server Administration

## What I Do

I am Windows Server, Microsoft's enterprise server operating system providing directory services, file sharing, virtualization, and application hosting. I offer Active Directory for centralized identity management, Hyper-V for virtualization, and seamless integration with Microsoft ecosystem. I provide GUI and PowerShell-based administration, supporting both traditional and containerized workloads. My licensing model includes per-core and per-user options. I support Windows Admin Center for modern web-based management. I integrate with Azure for hybrid cloud scenarios. I provide enterprise-grade security with Windows Defender, BitLocker, and Group Policy.

## When to Use Me

- Active Directory domain management
- File and print services
- Hyper-V virtualization
- IIS web hosting
- SQL Server hosting
- Exchange/Teams infrastructure
- Print/document management
- Hybrid Azure integration
- Windows container workloads

## Core Concepts

**Active Directory**: LDAP-based directory services for user and computer management.

**Group Policy**: Centralized configuration management for domain-joined systems.

**PowerShell**: Command-line shell and scripting language with module ecosystem.

**Hyper-V**: Native hypervisor for Windows virtualization.

**IIS**: Internet Information Services for web hosting.

**Windows Defender**: Built-in antivirus and endpoint protection.

**Remote Desktop Services**: Multi-user desktop and application virtualization.

## Code Examples

### Example 1: PowerShell Administration Module
```powershell
# Windows Server Administration Module
function Get-SystemInfo {
    <#
    .SYNOPSIS
        Get comprehensive system information
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$ComputerName = $env:COMPUTERNAME
    )
    
    $params = @{
        ClassName = 'Win32_OperatingSystem'
        ComputerName = $ComputerName
    }
    
    $os = Get-CimInstance @params
    
    $systemInfo = [PSCustomObject]@{
        ComputerName = $os.CSName
        OS = $os.Caption
        Version = $os.Version
        Build = $os.BuildNumber
        InstallDate = $os.InstallDate2
        LastBootUpTime = $os.LastBootUpTime
        Uptime = (Get-Date) - $os.LastBootUpTime
        TotalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        FreeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
        CPU = (Get-CimInstance -ClassName Win32_Processor -ComputerName $ComputerName).Name
    }
    
    return $systemInfo
}

function Get-DiskInfo {
    <#
    .SYNOPSIS
        Get disk usage and health information
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$ComputerName = $env:COMPUTERNAME
    )
    
    Get-CimInstance -ClassName Win32_LogicalDisk -ComputerName $ComputerName |
        Where-Object {$_.DriveType -eq 3} |
        ForEach-Object {
            [PSCustomObject]@{
                Drive = $_.DeviceID
                VolumeName = $_.VolumeName
                SizeGB = [math]::Round($_.Size / 1GB, 2)
                FreeSpaceGB = [math]::Round($_.FreeSpace / 1GB, 2)
                UsedGB = [math]::Round(($_.Size - $_.FreeSpace) / 1GB, 2)
                PercentFree = [math]::Round(($_.FreeSpace / $_.Size) * 100, 2)
                Health = if ($_.Status -eq 'OK') { 'Healthy' } else { 'Warning' }
            }
        }
}

function Get-ServiceStatus {
    <#
    .SYNOPSIS
        Check status of critical services
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [string[]]$ServiceName = @('WinRM', 'Dhcp', 'Dns', 'Netlogon', 'DFS', 'wuauserv'),
        
        [Parameter()]
        [string]$ComputerName = $env:COMPUTERNAME
    )
    
    foreach ($service in $ServiceName) {
        $svc = Get-Service -Name $service -ComputerName $ComputerName -ErrorAction SilentlyContinue
        
        if ($svc) {
            [PSCustomObject]@{
                Name = $svc.Name
                DisplayName = $svc.DisplayName
                Status = $svc.Status
                StartType = (Get-CimInstance -ClassName Win32_Service -Filter "Name='$service'" -ComputerName $ComputerName).StartMode
            }
        } else {
            Write-Warning "Service '$service' not found on $ComputerName"
        }
    }
}

function Test-NetworkConnectivity {
    <#
    .SYNOPSIS
        Test network connectivity to hosts
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string[]]$ComputerName,
        
        [Parameter()]
        [int]$Count = 4,
        
        [Parameter()]
        [int]$Timeout = 1000
    )
    
    foreach ($computer in $ComputerName) {
        $result = Test-Connection -ComputerName $computer -Count $Count -TimeoutSeconds ($Timeout / 1000) -ErrorAction SilentlyContinue
        
        if ($result) {
            [PSCustomObject]@{
                ComputerName = $computer
                IPAddress = $result.IPV4Address.IPAddressToString
                ResponseTime = $result.ResponseTime
                Status = 'Online'
            }
        } else {
            [PSCustomObject]@{
                ComputerName = $computer
                IPAddress = $null
                ResponseTime = $null
                Status = 'Offline'
            }
        }
    }
}

function Install-WindowsFeature {
    <#
    .SYNOPSIS
        Install Windows Server features
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string[]]$FeatureName,
        
        [Parameter()]
        [switch]$Restart,
        
        [Parameter()]
        [string]$SourcePath
    )
    
    foreach ($feature in $FeatureName) {
        Write-Output "Installing $feature..."
        
        $params = @{
            Name = $feature
            IncludeManagementTools = $true
            ErrorAction = 'Stop'
        }
        
        if ($SourcePath) {
            $params.Source = $SourcePath
        }
        
        if ($Restart) {
            $params.Restart = $true
        }
        
        try {
            Install-WindowsFeature @params | Out-Null
            Write-Output "Successfully installed $feature"
        } catch {
            Write-Error "Failed to install $feature: $_"
        }
    }
}

function New-UserAccount {
    <#
    .SYNOPSIS
        Create new Active Directory user
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$FirstName,
        
        [Parameter(Mandatory)]
        [string]$LastName,
        
        [Parameter(Mandatory)]
        [string]$OU,
        
        [Parameter()]
        [string]$Description,
        
        [Parameter()]
        [string]$Password,
        
        [Parameter()]
        [string[]]$Groups
    )
    
    $samAccountName = "$($FirstName.Substring(0,1))$LastName"
    $userPrincipalName = "$samAccountName@$((Get-ADDomain).DNSRoot)"
    $displayName = "$FirstName $LastName"
    
    $params = @{
        GivenName = $FirstName
        Surname = $LastName
        Name = $displayName
        DisplayName = $displayName
        SamAccountName = $samAccountName
        UserPrincipalName = $userPrincipalName
        Path = $OU
        AccountPassword = (ConvertTo-SecureString $Password -AsPlainText -Force)
        Enabled = $true
        Description = $Description
    }
    
    New-ADUser @params
    
    foreach ($group in $Groups) {
        Add-ADGroupMember -Identity $group -Members $samAccountName
    }
    
    Write-Output "User $displayName created successfully"
}

function Backup-SystemState {
    <#
    .SYNOPSIS
        Backup Windows Server system state
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$BackupPath,
        
        [Parameter()]
        [int]$RetentionDays = 30
    )
    
    if (-not (Test-Path $BackupPath)) {
        New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFolder = Join-Path $BackupPath "Backup_$timestamp"
    
    Write-Output "Starting system state backup to $backupFolder"
    
    try {
        # Create system state backup using Windows Server Backup
        $backupParams = @{
            BackupTarget = New-Object -TypeName Microsoft.Internal.IO.DirectoryString -ArgumentList $backupFolder
            SystemState = $true
            ErrorAction = 'Stop'
        }
        
        Start-WBBackup -Backup $backupParams | Out-Null
        
        Write-Output "Backup completed successfully"
        
        # Clean old backups
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        Get-ChildItem -Path $BackupPath -Directory |
            Where-Object {$_.CreationTime -lt $cutoffDate} |
            Remove-Item -Recurse -Force
            
        Write-Output "Old backups cleaned up"
        
    } catch {
        Write-Error "Backup failed: $_"
    }
}

# Export module functions
Export-ModuleMember -Function @(
    'Get-SystemInfo',
    'Get-DiskInfo',
    'Get-ServiceStatus',
    'Test-NetworkConnectivity',
    'Install-WindowsFeature',
    'New-UserAccount',
    'Backup-SystemState'
)
```

### Example 2: Active Directory Management
```powershell
# Active Directory Administration

# Get AD User Report
function Get-ADUserReport {
    Get-ADUser -Filter * -Properties * |
        Select-Object Name, SamAccountName, UserPrincipalName, 
                      Enabled, LastLogonDate, PasswordLastSet,
                      Created, Modified, MemberOf |
        Export-Csv -Path "$env:USERPROFILE\ADUserReport.csv" -NoTypeInformation
}

# Find Inactive Users
function Find-InactiveUsers {
    param(
        [Parameter()]
        [int]$DaysInactive = 90
    )
    
    $inactiveDate = (Get-Date).AddDays(-$DaysInactive)
    
    Get-ADUser -Filter {LastLogonDate -lt $inactiveDate} -Properties LastLogonDate |
        Select-Object Name, SamAccountName, LastLogonDate |
        Sort-Object LastLogonDate
}

# Group Policy Reporting
function Get-GPOReport {
    Get-GPO -All |
        ForEach-Object {
            [PSCustomObject]@{
                DisplayName = $_.DisplayName
                Id = $_.Id
                Owner = $_.Owner
                CreationTime = $_.CreationTime
                ModificationTime = $_.ModificationTime
                Status = $_.Status
                GpoStatus = $_.GpoStatus
            }
        } |
        Export-Csv -Path "$env:USERPROFILE\GPOReport.csv" -NoTypeInformation
}

# Computer Inventory
function Get-ADComputerInventory {
    Get-ADComputer -Filter * -Properties * |
        Select-Object Name, DNSHostName, OperatingSystem, 
                      OperatingSystemVersion, LastLogonDate,
                      IPv4Address, Enabled |
        Export-Csv -Path "$env:USERPROFILE\ComputerInventory.csv" -NoTypeInformation
}
```

### Example 3: IIS Administration
```powershell
# IIS Administration

# Get IIS Sites
function Get-IISSiteStatus {
    Get-Website |
        Select-Object Name, Id, State, PhysicalPath,
                      Bindings, ApplicationDefaults |
        Format-Table -Auto
}

# Create IIS Website
function New-IISWebsite {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        
        [Parameter(Mandatory)]
        [string]$PhysicalPath,
        
        [Parameter()]
        [string]$Binding = 'http/*:80:',
        
        [Parameter()]
        [string]$AppPoolName,
        
        [Parameter()]
        [string]$DotNetVersion = 'v4.0',
        
        [Parameter()]
        [switch]$EnableSSL
    )
    
    # Create application pool
    if (-not $AppPoolName) {
        $AppPoolName = $Name
    }
    
    New-WebAppPool -Name $AppPoolName -Force | Out-Null
    
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" `
                      -Name managedRuntimeVersion `
                      -Value $DotNetVersion
    
    # Create website
    $params = @{
        Name = $Name
        PhysicalPath = $PhysicalPath
        ApplicationPool = $AppPoolName
        Force = $true
    }
    
    if ($EnableSSL) {
        $binding = "https/*:443:$Name"
    } else {
        $binding = $Binding
    }
    
    New-Website @params
    
    # Configure bindings
    if ($EnableSSL) {
        Get-Website -Name $Name |
            Set-WebBinding -Name $Name `
                           -PropertyName bindingInformation `
                           -Value $binding `
                           -Protocol 'https'
        
        # Get or create SSL certificate
        $cert = Get-ChildItem -Path Cert:\LocalMachine\My |
                Where-Object {$_.Subject -eq "CN=$Name"} |
                Select-Object -First 1
        
        if (-not $cert) {
            $cert = New-SelfSignedCertificate -DnsName $Name, 'localhost' -CertStoreLocation 'cert:\LocalMachine\My'
        }
        
        Set-WebBinding -Name $Name `
                       -PropertyName 'sslFlags' `
                       -Value 0 `
                       -Protocol 'https'
        
        $binding = Get-WebBinding -Name $Name -Protocol 'https'
        $binding.AddSslCertificate($cert.Thumbprint, 'My')
    }
    
    Write-Output "Website $Name created successfully"
}

# Get IIS Logs
function Get-IISLogs {
    param(
        [Parameter()]
        [string]$SiteName = 'Default Web Site',
        
        [Parameter()]
        [int]$LastHours = 24
    )
    
    $logPath = "$env:SystemDrive\inetpub\logs\LogFiles\W3SVC1"
    
    Get-ChildItem -Path $logPath -Filter '*.log' |
        Where-Object {$_.LastWriteTime -gt (Get-Date).AddHours(-$LastHours)} |
        Get-Content |
        Select-Object -Last 1000
}

# Monitor IIS Performance
function Get-IISPerformance {
    $counters = @(
        '\Web Service(_Total)\Current Connections',
        '\Web Service(_Total)\Total Connection Attempts',
        '\ASP.NET Applications(__Total__)\Requests/sec',
        '\ASP.NET v4.0.30319\Request Execution Time'
    )
    
    Get-Counter -Counter $counters -SampleInterval 2 -MaxSamples 5 |
        ForEach-Object {$_.CounterSamples} |
        Select-Object Path, CookedValue
}
```

## Best Practices

- Keep Windows Server updated through Windows Update or WSUS
- Use Active Directory for centralized management
- Implement least privilege for service accounts
- Enable Windows Defender with regular scans
- Use Group Policy for consistent configurations
- Implement proper backup and disaster recovery
- Monitor with Event Log and Performance Monitor
- Use Secure Boot and BitLocker for security
- Enable RDP with Network Level Authentication
- Implement proper firewall rules

## Core Competencies

- Active Directory management
- PowerShell scripting
- Group Policy configuration
- Hyper-V administration
- IIS web server management
- Windows Defender configuration
- Remote Desktop Services
- File and storage management
- Network policy configuration
- Certificate services
- DNS and DHCP management
- Backup and recovery
- Performance monitoring
- Security hardening
