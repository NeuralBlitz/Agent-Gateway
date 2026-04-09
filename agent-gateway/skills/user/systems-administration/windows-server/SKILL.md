---
name: windows-server
description: Windows Server administration and PowerShell automation for enterprise environments
license: MIT
compatibility: opencode
metadata:
  audience: system-administrators
  category: systems-administration
---

## What I do
- Manage Windows Server roles and features
- Configure Active Directory and Group Policy
- Monitor server performance and health
- Manage Hyper-V virtualization
- Configure file and storage services
- Implement backup and disaster recovery
- Automate administrative tasks with PowerShell
- Configure network services (DNS, DHCP, NPS)
- Harden server security
- Troubleshoot Windows-specific issues

## When to use me
When administering Windows Server environments, managing Active Directory, or automating Windows infrastructure tasks with PowerShell.

## Core Concepts
- Active Directory management
- Group Policy configuration
- Hyper-V and VM management
- Windows Server roles (AD DS, DNS, DHCP, File Services)
- PowerShell scripting and Desired State Configuration
- Windows Defender and security
- Storage spaces and ReFS
- Failover clustering
- Windows Admin Center management
- Event log analysis

## Code Examples

### Server Management
```powershell
# Get comprehensive server health
function Get-ServerHealth {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$ComputerName
    )
    
    foreach ($computer in $ComputerName) {
        $health = [PSCustomObject]@{
            ComputerName = $computer
            Status = "Unknown"
            Uptime = $null
            CPU = $null
            Memory = $null
            Disk = @()
            Services = @()
            Updates = $null
        }
        
        try {
            $os = Get-CimInstance -ClassName Win32_OperatingSystem -ComputerName $computer -ErrorAction Stop
            $health.Uptime = (Get-Date) - $os.LastBootUpTime
            $health.Status = "Online"
            
            # CPU and Memory
            $cpu = Get-CimInstance -ClassName Win32_Processor -ComputerName $computer
            $health.CPU = [PSCustomObject]@{
                LoadPercent = $cpu.LoadPercentage
                Cores = $cpu.NumberOfCores
            }
            
            $memory = Get-CimInstance -ClassName Win32_ComputerSystem -ComputerName $computer
            $health.Memory = [PSCustomObject]@{
                TotalGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
                UsedGB = [math]::Round(($memory.TotalPhysicalMemory - (Get-CimInstance -ClassName Win32_OperatingSystem -ComputerName $computer).FreePhysicalMemory * 1KB) / 1GB, 2)
            }
            
            # Disk usage
            $disks = Get-CimInstance -ClassName Win32_LogicalDisk -ComputerName $computer -Filter "DriveType=3"
            foreach ($disk in $disks) {
                $health.Disk += [PSCustomObject]@{
                    Drive = $disk.DeviceID
                    SizeGB = [math]::Round($disk.Size / 1GB, 2)
                    FreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
                    PercentFree = [math]::Round($disk.FreeSpace / $disk.Size * 100, 1)
                }
            }
            
            # Critical services
            $services = Get-Service -ComputerName $computer | Where-Object {$_.Status -eq "Stopped" -and $_.StartType -eq "Automatic"}
            $health.Services = $services | Select-Object -First 10 Name, DisplayName
        }
        catch {
            $health.Status = "Offline - $($_.Exception.Message)"
        }
        
        Write-Output $health
    }
}

# Get-WindowsServerHealth -ComputerName "SRV01", "SRV02"
```

### Active Directory Management
```powershell
# Create new AD user
function New-ADUserEnhanced {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$FirstName,
        
        [Parameter(Mandatory=$true)]
        [string]$LastName,
        
        [Parameter(Mandatory=$true)]
        [string]$Username,
        
        [Parameter(Mandatory=$true)]
        [string]$OU,
        
        [string]$Description,
        
        [string]$Email,
        
        [string[]]$Groups,
        
        [string]$Password = (ConvertTo-SecureString -AsPlainText "ChangeMe123!" -Force)
    )
    
    $displayName = "$FirstName $LastName"
    $samAccountName = $Username
    
    try {
        $userParams = @{
            GivenName = $FirstName
            Surname = $LastName
            Name = $displayName
            DisplayName = $displayName
            SamAccountName = $samAccountName
            UserPrincipalName = "$Username@$((Get-ADDomain).DNSRoot)"
            Path = $OU
            AccountPassword = $Password
            Enabled = $true
            ChangePasswordAtLogon = $true
            Description = $Description
            EmailAddress = $Email
        }
        
        $newUser = New-ADUser @userParams -ErrorAction Stop
        
        # Add to groups
        foreach ($group in $Groups) {
            Add-ADGroupMember -Identity $group -Members $samAccountName -ErrorAction SilentlyContinue
        }
        
        Write-Host "Created user: $displayName" -ForegroundColor Green
        return $newUser
    }
    catch {
        Write-Error "Failed to create user: $($_.Exception.Message)"
        return $null
    }
}

# Bulk create users from CSV
function Import-ADUsersBulk {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CSVPath
    )
    
    $users = Import-Csv -Path $CSVPath
    
    foreach ($user in $users) {
        New-ADUserEnhanced `
            -FirstName $user.FirstName `
            -LastName $user.LastName `
            -Username $user.Username `
            -OU $user.OU `
            -Description $user.Description `
            -Groups $user.Groups.Split(',')
    }
}
```

### Hyper-V Management
```powershell
# Get VM health and performance
function Get-VMHealthReport {
    [CmdletBinding()]
    param(
        [string[]]$VMNames = (Get-VM | Select-Object -ExpandProperty Name),
        [int]$HistoryMinutes = 5
    )
    
    $report = @()
    
    foreach ($vmName in $VMNames) {
        try {
            $vm = Get-VM -Name $vmName -ErrorAction Stop
            
            $vmReport = [PSCustomObject]@{
                Name = $vm.Name
                State = $vm.State
                Uptime = $vm.Uptime
                CPUUsage = (Get-VMProcessor -VMName $vmName).CombinedAverageLoadPercent
                MemoryAssigned = [math]::Round($vm.MemoryAssigned / 1GB, 2)
                MemoryDemand = [math]::Round($vm.MemoryDemand / 1GB, 2)
                NetworkUsage = ($vm.NetworkAdapters | Measure-Object -Property BytesReceived -Sum).Sum / 1MB
                DiskUsage = ($vm.HardDrives | Measure-Object -Property DiskSize -Sum).Sum / 1GB
                Checkpoints = ($vm | Get-VMCheckpoint).Count
            }
            
            $report += $vmReport
        }
        catch {
            Write-Warning "Could not get status for $vmName: $_"
        }
    }
    
    return $report | Format-Table -AutoSize
}

# Quick VM operations
function Invoke-VMQuickAction {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$VMName,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('Start', 'Stop', 'Restart', 'Save', 'Snapshot')]
        [string]$Action
    )
    
    switch ($Action) {
        'Start' {
            Start-VM -Name $VMName -Force
            Write-Host "Started VM: $VMName" -ForegroundColor Green
        }
        'Stop' {
            Stop-VM -Name $VMName -Force -TurnOff
            Write-Host "Stopped VM: $VMName" -ForegroundColor Yellow
        }
        'Restart' {
            Stop-VM -Name $VMName -Force -TurnOff
            Start-VM -Name $VMName
            Write-Host "Restarted VM: $VMName" -ForegroundColor Cyan
        }
        'Save' {
            Save-VM -Name $VMName
            Write-Host "Saved VM: $VMName" -ForegroundColor Green
        }
        'Snapshot' {
            $snapshotName = "$VMName-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Checkpoint-VM -Name $VMName -SnapshotName $snapshotName
            Write-Host "Created snapshot: $snapshotName" -ForegroundColor Green
        }
    }
}
```

### Group Policy Management
```powershell
# Get GPO report
function Get-GPOReport {
    [CmdletBinding()]
    param(
        [string]$GPOName = "All",
        [string]$OutputPath = ".\GPOReports"
    )
    
    if (-not (Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    
    $gpos = if ($GPOName -eq "All") {
        Get-GPO -All
    } else {
        Get-GPO -Name $GPOName
    }
    
    foreach ($gpo in $gpos) {
        $reportPath = Join-Path -Path $OutputPath -ChildPath "$($gpo.DisplayName).html"
        Get-GPOReport -Name $gpo.DisplayName -Path $reportPath -HTML
        Write-Host "Generated report: $reportPath" -ForegroundColor Green
    }
}

# Find GPO applying to a specific OU
function Find-GPOForOU {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$OUPath
    )
    
    $ou = Get-ADOrganizationalUnit -Identity $OUPath
    
    # Get inherited GPOs
    $gpResults = Get-GPInheritance -Target $ou.DistinguishedName
    
    [PSCustomObject]@{
        OU = $ou.Name
        GPOs = $gpResults.InheritedGpoLinks | Select-Object DisplayName, Enforced, GpoStatus
    }
}
```

## Best Practices
- Use Server Core installations when GUI is not required
- Enable Windows Defender and keep definitions updated
- Use Just Enough Admin (JEA) for delegation
- Implement proper backup strategies using Windows Server Backup
- Use SMB signing and encryption for file shares
- Enable SMBv1 only when absolutely necessary
- Use Group Policy Preferences with item-level targeting
- Monitor event logs with Windows Event Forwarding
- Use DSC for configuration management
- Keep patch management automated and tested
