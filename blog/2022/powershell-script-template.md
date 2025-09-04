---
title: "Powershell Script Template"
description: "A comprehensive PowerShell script template with best practices, error handling, and logging"
date: "2022-05-16"
categories: ["PowerShell", "Templates", "Best Practices"]
tags: ["powershell", "template", "scripting", "best practices"]
---

# PowerShell Script Template

*Published on May 16, 2022*

A comprehensive PowerShell script template that incorporates best practices, proper error handling, logging, and parameter validation.

## Complete Script Template

```powershell
<#
.SYNOPSIS
    Brief description of what the script does
    
.DESCRIPTION
    Detailed description of the script's functionality, purpose, and usage scenarios
    
.PARAMETER ComputerName
    Specifies the computer name(s) to target
    
.PARAMETER Path
    Specifies the path for input/output operations
    
.PARAMETER Credential
    Specifies credentials for authentication
    
.PARAMETER LogPath
    Specifies the path for log file output
    
.EXAMPLE
    .\ScriptTemplate.ps1 -ComputerName "SERVER01" -Path "C:\Data"
    
.EXAMPLE
    .\ScriptTemplate.ps1 -ComputerName @("SERVER01","SERVER02") -LogPath "C:\Logs\script.log"
    
.NOTES
    Author: Your Name
    Version: 1.0
    Created: Date
    Modified: Date
    
.LINK
    https://your-documentation-link.com
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true, 
               ValueFromPipeline = $true,
               ValueFromPipelineByPropertyName = $true,
               HelpMessage = "Specify computer name(s) to target")]
    [ValidateNotNullOrEmpty()]
    [Alias("CN", "Computer")]
    [string[]]$ComputerName,
    
    [Parameter(Mandatory = $false)]
    [ValidateScript({Test-Path $_ -IsValid})]
    [string]$Path = "C:\Temp",
    
    [Parameter(Mandatory = $false)]
    [PSCredential]$Credential,
    
    [Parameter(Mandatory = $false)]
    [ValidateScript({Test-Path (Split-Path $_ -Parent) -PathType Container})]
    [string]$LogPath = "$env:TEMP\ScriptLog_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
)

#Requires -Version 5.1
#Requires -RunAsAdministrator

# Script variables
$ErrorActionPreference = "Stop"
$VerbosePreference = if ($PSBoundParameters.Verbose) { "Continue" } else { "SilentlyContinue" }
$ScriptName = [System.IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)
$ScriptVersion = "1.0"
$StartTime = Get-Date

# Initialize logging
if (!(Test-Path (Split-Path $LogPath -Parent))) {
    New-Item -ItemType Directory -Path (Split-Path $LogPath -Parent) -Force | Out-Null
}

# Logging function
function Write-LogEntry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("Information", "Warning", "Error")]
        [string]$Level = "Information"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Write to console with appropriate color
    switch ($Level) {
        "Information" { Write-Host $LogEntry -ForegroundColor Green }
        "Warning" { Write-Warning $LogEntry }
        "Error" { Write-Error $LogEntry }
    }
    
    # Write to log file
    Add-Content -Path $LogPath -Value $LogEntry -ErrorAction SilentlyContinue
}

# Error handling function
function Handle-Error {
    param(
        [Parameter(Mandatory = $true)]
        [System.Management.Automation.ErrorRecord]$ErrorRecord,
        
        [Parameter(Mandatory = $false)]
        [string]$CustomMessage
    )
    
    $ErrorMessage = if ($CustomMessage) { 
        "$CustomMessage - $($ErrorRecord.Exception.Message)"
    } else { 
        $ErrorRecord.Exception.Message 
    }
    
    Write-LogEntry -Message "ERROR: $ErrorMessage" -Level "Error"
    Write-LogEntry -Message "ERROR DETAILS: Line $($ErrorRecord.InvocationInfo.ScriptLineNumber) - $($ErrorRecord.InvocationInfo.Line.Trim())" -Level "Error"
}

# Function to test prerequisites
function Test-Prerequisites {
    Write-LogEntry -Message "Testing prerequisites..."
    
    # Test PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        throw "PowerShell 5.1 or higher is required"
    }
    
    # Test if running as administrator
    $CurrentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    if (-not $CurrentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "This script must be run as Administrator"
    }
    
    # Test network connectivity for remote operations
    if ($ComputerName -ne $env:COMPUTERNAME) {
        foreach ($Computer in $ComputerName) {
            if (-not (Test-Connection -ComputerName $Computer -Count 1 -Quiet)) {
                throw "Cannot connect to computer: $Computer"
            }
        }
    }
    
    Write-LogEntry -Message "Prerequisites check passed"
}

# Main processing function
function Invoke-MainProcess {
    param(
        [string]$TargetComputer
    )
    
    Write-LogEntry -Message "Processing computer: $TargetComputer"
    
    try {
        # Your main script logic goes here
        
        # Example: Get system information
        $SystemInfo = if ($TargetComputer -eq $env:COMPUTERNAME) {
            Get-ComputerInfo
        } else {
            Invoke-Command -ComputerName $TargetComputer -Credential $Credential -ScriptBlock {
                Get-ComputerInfo
            }
        }
        
        # Example: Process the information
        $Result = [PSCustomObject]@{
            ComputerName = $TargetComputer
            OperatingSystem = $SystemInfo.WindowsProductName
            Version = $SystemInfo.WindowsVersion
            LastBootTime = $SystemInfo.LastBootUpTime
            ProcessedTime = Get-Date
        }
        
        Write-LogEntry -Message "Successfully processed $TargetComputer"
        return $Result
        
    } catch {
        Handle-Error -ErrorRecord $_ -CustomMessage "Failed to process computer $TargetComputer"
        return $null
    }
}

# Cleanup function
function Invoke-Cleanup {
    Write-LogEntry -Message "Performing cleanup operations..."
    
    # Clean up temporary files, connections, etc.
    # Remove-Item $TempFiles -ErrorAction SilentlyContinue
    
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    Write-LogEntry -Message "Script execution completed in $($Duration.TotalSeconds) seconds"
    Write-LogEntry -Message "Log file saved to: $LogPath"
}

# Main execution block
try {
    # Script header
    Write-LogEntry -Message "=== $ScriptName v$ScriptVersion Started ==="
    Write-LogEntry -Message "Parameters: ComputerName=$($ComputerName -join ','), Path=$Path"
    
    # Test prerequisites
    Test-Prerequisites
    
    # Initialize results collection
    $Results = @()
    
    # Process each computer
    foreach ($Computer in $ComputerName) {
        if ($PSCmdlet.ShouldProcess($Computer, "Process Computer")) {
            $Result = Invoke-MainProcess -TargetComputer $Computer
            if ($Result) {
                $Results += $Result
            }
        }
    }
    
    # Output results
    if ($Results.Count -gt 0) {
        Write-LogEntry -Message "Successfully processed $($Results.Count) computer(s)"
        $Results | Format-Table -AutoSize
        
        # Export results if needed
        $OutputPath = Join-Path $Path "Results_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
        $Results | Export-Csv -Path $OutputPath -NoTypeInformation
        Write-LogEntry -Message "Results exported to: $OutputPath"
    } else {
        Write-LogEntry -Message "No results to display" -Level "Warning"
    }
    
} catch {
    Handle-Error -ErrorRecord $_ -CustomMessage "Script execution failed"
    exit 1
} finally {
    Invoke-Cleanup
}
```

## Template Features

### Parameter Validation
- **Mandatory parameters** with proper validation
- **Pipeline support** for input objects
- **Parameter aliases** for flexibility
- **Help messages** for user guidance
- **Path validation** to ensure valid file paths

### Error Handling
- **Try-catch blocks** around critical operations
- **Custom error handling** function
- **Detailed error logging** with line numbers
- **Graceful error recovery** where possible

### Logging System
- **Structured logging** with timestamps and levels
- **Console output** with color coding
- **File-based logging** for audit trails
- **Log rotation** considerations

### Best Practices Implementation
- **Requires statements** for version and privilege checks
- **SupportsShouldProcess** for WhatIf scenarios
- **Proper variable scoping**
- **Comment-based help** documentation
- **Version information** tracking

### Modular Design
- **Separate functions** for different operations
- **Reusable components** across scripts
- **Easy maintenance** and updates
- **Unit testing** friendly structure

## Usage Examples

### Basic Execution
```powershell
.\ScriptTemplate.ps1 -ComputerName "SERVER01"
```

### Multiple Computers
```powershell
.\ScriptTemplate.ps1 -ComputerName @("SERVER01", "SERVER02", "SERVER03")
```

### With Custom Parameters
```powershell
.\ScriptTemplate.ps1 -ComputerName "SERVER01" -Path "C:\Output" -LogPath "C:\Logs\custom.log"
```

### WhatIf Testing
```powershell
.\ScriptTemplate.ps1 -ComputerName "SERVER01" -WhatIf
```

## Customization Guidelines

1. **Replace placeholder logic** with your specific requirements
2. **Modify parameter definitions** based on your needs
3. **Update help documentation** with accurate descriptions
4. **Adjust error handling** for your specific scenarios
5. **Customize logging levels** and output formats

## Benefits

- **Consistency** across all your PowerShell scripts
- **Reliability** through proper error handling
- **Maintainability** with modular design
- **Debuggability** with comprehensive logging
- **Professional quality** with proper documentation

This template provides a solid foundation for creating robust PowerShell scripts that follow industry best practices and can be easily maintained and extended.
