---
title: "RMM Powershell Script Building"
description: "Powershell Scripting for RMM"
date: "2023-01-01"
categories: ["PowerShell", "RMM", "Scripting"]
tags: ["powershell", "rmm", "system", "scripting", "automation"]
---

# RMM Powershell Script Building

*Published on January 1, 2023*

## Powershell Scripting for RMM

The idea behind this post is to document a way to setup a build environment for building Powershell scripts running via RMM.

## Setup

- Create a 'scripts' folder at the root of C:\
- Download PS Tools  
- Place the file PsExec.exe in the 'scripts' folder you created.
- Create your scripts in the same folder.
- Install VSCode with the Powershell extension.
- Verify you're testing your scripts with Powershell 5.1.

## Getting Started

RMM Systems such as TacticalRMM use the System account to run their scripts. In order to run under a user context you must use a built-in method with your RMM or use the RunAsUser Powershell module.

1. Open a Powershell window as Admin.
2. Navigate to the root of C:\ and enter the scripts folder.
3. Launch a new Powershell window as System using PsExec.

```powershell
.\PsExec -i -s "powershell.exe"
```

4. In the new window navigate to our C:\scripts directory.
5. Verify we are running as System

```powershell
whoami
```

Output should look like the following:
```
nt authority\system
```

We are now ready to start scripting.

**Note:** All scripts and testing should be done from the Powershell window running in the system context.

## Key Considerations

### System Context Limitations
- Limited network access compared to user context
- Different registry hives accessible
- No access to user profile or user-specific applications
- Different environment variables

### Best Practices
- Always test scripts in the same context they'll run in production
- Use proper error handling and logging
- Consider user context requirements vs system context capabilities
- Validate permissions and access before executing operations

### Common Use Cases
- System maintenance and configuration
- Software installation and updates  
- Registry modifications
- Service management
- File system operations
- Security policy enforcement

This setup provides a reliable testing environment that matches how your scripts will execute in production RMM environments.
