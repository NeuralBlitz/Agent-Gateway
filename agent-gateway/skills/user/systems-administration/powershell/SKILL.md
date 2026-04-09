---
name: powershell
description: PowerShell scripting for Windows automation, system administration, and cloud management
license: MIT
compatibility: opencode
metadata:
  audience: system-administrators
  category: systems-administration
---

## What I do
- Automate Windows administration tasks
- Manage Active Directory and Exchange
- Configure Azure and Microsoft 365
- Process data and generate reports
- Manage Windows services and processes
- Interact with REST APIs
- Handle JSON, XML, and CSV data
- Create Desired State Configuration
- Build GUI tools with WinForms/WPF
- Manage Hyper-V and Azure VMs

## When to use me
When automating Windows Server, Azure, Microsoft 365, or any Microsoft ecosystem administration tasks.

## Core Concepts
- PowerShell cmdlets and Get-Help
- Pipeline and object manipulation
- Script modules and module manifests
- Error handling with try/catch
- Remote management with Invoke-Command
- DSC (Desired State Configuration)
- Pester testing for scripts
- Classes and enum types
- Workflows and jobs
- Azure PowerShell modules

## Code Examples

### Enterprise Administration
```powershell
# Cross-server inventory collection
function Get-ServerInventory {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$ComputerName,
        
        [PSCredential]$Credential
    )
    
    $scriptBlock = {
        $inventory = [PSCustomObject]@{
            ComputerName = $env:COMPUTERNAME
            OS = (Get-CimInstance Win32_OperatingSystem).Caption
            OSVersion = (Get-CimInstance Win32_OperatingSystem).Version
            InstallDate = (Get-CimInstance Win32_OperatingSystem).InstallDate
            LastBootUpTime = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
            MemoryGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
            CPU = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
            Cores = ((Get-CimInstance Win32_Processor).NumberOfCores | Measure-Object -Sum).Sum
            Disks = @()
            NetworkAdapters = @()
            InstalledSoftware = @()
            Hotfixes = @()
            Services = @()
            ScheduledTasks = @()
        }
        
        # Disk information
        Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
            $inventory.Disks += [PSCustomObject]@{
                Drive = $_.DeviceID
                SizeGB = [math]::Round($_.Size / 1GB, 2)
                FreeGB = [math]::Round($_.FreeSpace / 1GB, 2)
                PercentFree = [math]::Round($_.FreeSpace / $_.Size * 100, 1)
            }
        }
        
        # Network adapters
        Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | ForEach-Object {
            $inventory.NetworkAdapters += [PSCustomObject]@{
                Name = $_.Name
                MacAddress = $_.MacAddress
                LinkSpeed = $_.LinkSpeed
                IPAddresses = (Get-NetIPConfiguration | Where-Object {$_.InterfaceAlias -eq $_.Name}).IPv4Address.IPAddress
            }
        }
        
        # Installed software
        Get-Package | Where-Object {$_.ProviderName -eq 'Programs'} | ForEach-Object {
            $inventory.InstalledSoftware += [PSCustomObject]@{
                Name = $_.Name
                Version = $_.Version
                ProviderName = $_.ProviderName
            }
        }
        
        # Windows updates
        Get-CimInstance -Query "SELECT * FROM Win32_QuickFixEngineering" | ForEach-Object {
            $inventory.Hotfixes += $_.HotFixID
        }
        
        # Running services
        Get-Service | Where-Object {$_.Status -eq 'Running'} | ForEach-Object {
            $inventory.Services += $_.Name
        }
        
        return $inventory
    }
    
    $params = @{
        ScriptBlock = $scriptBlock
        ErrorAction = 'SilentlyContinue'
    }
    
    if ($Credential) {
        $params.Credential = $Credential
    }
    
    foreach ($computer in $ComputerName) {
        Write-Progress "Collecting inventory from $computer"
        Invoke-Command @params -ComputerName $computer
    }
}

# Generate comprehensive report
function Export-InventoryReport {
    param(
        [string[]]$ComputerName,
        [string]$OutputPath = ".\InventoryReport"
    )
    
    $data = Get-ServerInventory -ComputerName $ComputerName
    
    # Export to JSON
    $data | ConvertTo-Json -Depth 10 | Out-File "$OutputPath.json"
    
    # Generate HTML report
    $html = @"
<html>
<head>
    <style>
        body { font-family: Arial; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Server Inventory Report</h1>
    <p>Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
    <p>Total Servers: $($data.Count)</p>
</body>
</html>
"@
    
    $html | Out-File "$OutputPath.html"
    Write-Host "Report exported to $OutputPath" -ForegroundColor Green
}
```

### Azure Management
```powershell
# Azure VM lifecycle management
function Invoke-AzureVMLifecycle {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$ResourceGroupName,
        
        [Parameter(Mandatory=$true)]
        [ValidateSet('Start', 'Stop', 'Restart', 'Deallocate')]
        [string]$Action,
        
        [string]$VmName = "*",
        
        [switch]$WhatIf
    )
    
    # Ensure logged in
    if (-not (Get-AzContext)) {
        Connect-AzAccount
    }
    
    $vms = Get-AzVM -ResourceGroupName $ResourceGroupName -Name $VmName -ErrorAction SilentlyContinue
    
    foreach ($vm in $vms) {
        switch ($Action) {
            'Start' {
                if ($WhatIf) {
                    Write-Host "[WHATIF] Would start VM: $($vm.Name)" -ForegroundColor Yellow
                } else {
                    Write-Host "Starting VM: $($vm.Name)" -ForegroundColor Green
                    $vm | Start-AzVM -NoWait
                }
            }
            'Stop' {
                if ($WhatIf) {
                    Write-Host "[WHATIF] Would stop VM: $($vm.Name)" -ForegroundColor Yellow
                } else {
                    Write-Host "Stopping VM: $($vm.Name)" -ForegroundColor Yellow
                    $vm | Stop-AzVM -Force
                }
            }
            'Restart' {
                if ($WhatIf) {
                    Write-Host "[WHATIF] Would restart VM: $($vm.Name)" -ForegroundColor Yellow
                } else {
                    Write-Host "Restarting VM: $($vm.Name)" -ForegroundColor Cyan
                    $vm | Restart-AzVM
                }
            }
            'Deallocate' {
                if ($WhatIf) {
                    Write-Host "[WHATIF] Would deallocate VM: $($vm.Name)" -ForegroundColor Yellow
                } else {
                    Write-Host "Deallocating VM: $($vm.Name)" -ForegroundColor Yellow
                    $vm | Stop-AzVM -Force
                }
            }
        }
    }
}

# Azure resource inventory
function Get-AzureResourceInventory {
    param(
        [string]$Subscription = "*",
        [string]$ResourceType = "*"
    )
    
    $inventory = @()
    
    Get-AzSubscription -Name $Subscription | Select-AzSubscription | ForEach-Object {
        Get-AzResource -ResourceType $ResourceType | ForEach-Object {
            $inventory += [PSCustomObject]@{
                Name = $_.Name
                ResourceType = $_.ResourceType
                ResourceGroup = $_.ResourceGroupName
                Location = $_.Location
                Tags = ($_.Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ", "
                CreatedTime = $_.CreatedTime
            }
        }
    }
    
    return $inventory | Sort-Object ResourceType, Name
}
```

### Desired State Configuration
```powershell
configuration AppServerConfig {
    param(
        [Parameter(Mandatory=$true)]
        [string[]]$NodeName,
        
        [Parameter(Mandatory=$true)]
        [string]$AppName,
        
        [string]$Version = "1.0.0"
    )
    
    Import-DscResource -ModuleName PSDesiredStateConfiguration -ModuleVersion 1.1
    Import-DscResource -ModuleName xWebAdministration -ModuleVersion 3.2.0
    
    node $NodeName {
        WindowsFeature WebServer {
            Name = "Web-Server"
            Ensure = "Present"
        }
        
        WindowsFeature ASPNet45 {
            Name = "Web-Asp-Net45"
            Ensure = "Present"
            DependsOn = "[WindowsFeature]WebServer"
        }
        
        xWebsite DefaultSite {
            Name = "Default Web Site"
            BindingInfo = @(
                MSFT_xWebBindingInformation {
                    Protocol = "http"
                    Port = 80
                }
            )
            PhysicalPath = "C:\inetpub\wwwroot"
            DependsOn = "[WindowsFeature]WebServer"
        }
        
        File AppDirectory {
            DestinationPath = "C:\Apps\$AppName"
            Ensure = "Present"
            Type = "Directory"
        }
        
        xRemoteFile DownloadPackage {
            Uri = "https://example.com/packages/$AppName-$Version.zip"
            DestinationPath = "C:\Apps\$AppName\package.zip"
            DependsOn = "[File]AppDirectory"
        }
        
        Archive ExtractPackage {
            Path = "C:\Apps\$AppName\package.zip"
            Destination = "C:\Apps\$AppName"
            DependsOn = "[xRemoteFile]DownloadPackage"
        }
        
        Service AppService {
            Name = $AppName
            State = "Running"
            StartupType = "Automatic"
            DependsOn = "[Archive]ExtractPackage"
        }
    }
}

# Apply configuration
AppServerConfig -NodeName "APP-SRV01", "APP-SRV02" -AppName "MyApplication" -Version "2.1.0"
Start-DscConfiguration -Path ".\AppServerConfig" -Wait -Verbose -Force
```

## Best Practices
- Use `Write-Progress` for long-running operations
- Always use `-ErrorAction Stop` for critical operations
- Validate parameters with `[ValidateSet()]`, `[Parameter()]`
- Use `ShouldProcess` for confirmation prompts
- Return objects from functions for pipeline use
- Use `Import-Module` with minimum required version
- Profile modules for performance bottlenecks
- Use Pester for unit and integration testing
- Follow verb-noun naming convention strictly
- Document functions with comment-based help
