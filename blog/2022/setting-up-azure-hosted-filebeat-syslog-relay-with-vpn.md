---
title: "Setting up Azure Hosted Filebeat Syslog Relay with VPN"
description: "Configure an Azure-hosted Filebeat syslog relay with VPN connectivity for centralized log collection"
date: "2022-07-06"
categories: ["Azure", "Logging", "Networking", "Security"]
tags: ["azure", "filebeat", "syslog", "vpn", "logging", "elk"]
---

# Setting up Azure Hosted Filebeat Syslog Relay with VPN

*Published on July 6, 2022*

This guide covers setting up a Filebeat syslog relay hosted in Azure with VPN connectivity for secure centralized log collection from multiple sources.

## Overview

A centralized logging solution using Azure-hosted Filebeat provides scalable log collection, processing, and forwarding capabilities. Adding VPN connectivity ensures secure transmission of sensitive log data.

## Architecture Components

- **Azure Virtual Machine** - Hosting Filebeat and syslog services
- **VPN Gateway** - Secure connectivity to on-premises networks
- **Filebeat** - Log shipping and processing
- **Elastic Stack** - Log storage and analysis (destination)
- **Network Security Groups** - Traffic filtering and security

## Prerequisites

- Azure subscription with appropriate permissions
- Virtual network configured in Azure
- VPN gateway or ExpressRoute for secure connectivity
- Target log destination (Elasticsearch, Logstash, etc.)

## Azure Infrastructure Setup

### Virtual Machine Configuration
```bash
# Create resource group
az group create --name rg-logging --location eastus

# Create virtual network
az network vnet create --resource-group rg-logging --name vnet-logging --address-prefix 10.0.0.0/16

# Create subnet
az network vnet subnet create --resource-group rg-logging --vnet-name vnet-logging --name subnet-logging --address-prefix 10.0.1.0/24

# Create VM for Filebeat
az vm create --resource-group rg-logging --name vm-filebeat --image UbuntuLTS --size Standard_B2s --vnet-name vnet-logging --subnet subnet-logging
```

### Network Security Configuration
```bash
# Create NSG rule for syslog traffic
az network nsg rule create --resource-group rg-logging --nsg-name vm-filebeatNSG --name Allow-Syslog --priority 1000 --source-address-prefixes 10.0.0.0/16 --destination-port-ranges 514 --protocol Udp
```

## Filebeat Installation and Configuration

### Install Filebeat
```bash
# Download and install Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-linux-x86_64.tar.gz
tar xzvf filebeat-8.0.0-linux-x86_64.tar.gz
sudo mv filebeat-8.0.0-linux-x86_64 /opt/filebeat
```

### Configure Filebeat for Syslog Input
```yaml
# /opt/filebeat/filebeat.yml
filebeat.inputs:
- type: syslog
  protocol.udp:
    host: "0.0.0.0:514"
  protocol.tcp:
    host: "0.0.0.0:514"

output.elasticsearch:
  hosts: ["your-elasticsearch-cluster:9200"]
  username: "elastic"
  password: "your-password"

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644
```

## VPN Configuration

### Site-to-Site VPN Setup
```bash
# Create VPN gateway
az network vnet-gateway create --resource-group rg-logging --name vpn-gateway --public-ip-address vpn-gateway-ip --vnet vnet-logging --gateway-type Vpn --sku VpnGw1 --vpn-type RouteBased

# Create local network gateway (on-premises)
az network local-gateway create --resource-group rg-logging --name local-gateway --local-address-prefixes 192.168.0.0/16 --gateway-ip-address YOUR_PUBLIC_IP

# Create VPN connection
az network vpn-connection create --resource-group rg-logging --name vpn-connection --vnet-gateway1 vpn-gateway --local-gateway2 local-gateway --shared-key YOUR_SHARED_KEY
```

## Syslog Sources Configuration

### Configuring Network Devices
```bash
# Cisco router/switch syslog configuration
configure terminal
logging host 10.0.1.4
logging facility local7
logging trap informational
exit
```

### Linux Systems Rsyslog Configuration
```bash
# /etc/rsyslog.conf
# Forward logs to Azure Filebeat relay
*.* @10.0.1.4:514

# Restart rsyslog
sudo systemctl restart rsyslog
```

## Security Hardening

### Firewall Configuration
```bash
# UFW firewall rules
sudo ufw allow from 10.0.0.0/8 to any port 514
sudo ufw allow from 192.168.0.0/16 to any port 514
sudo ufw deny 514
```

### SSL/TLS Configuration
```yaml
# Enhanced Filebeat configuration with TLS
output.elasticsearch:
  hosts: ["your-elasticsearch-cluster:9200"]
  protocol: "https"
  ssl.certificate_authorities: ["/etc/ssl/certs/ca-certificates.crt"]
  ssl.verification_mode: "strict"
```

## Monitoring and Alerting

### Health Checks
```bash
# Filebeat status monitoring script
#!/bin/bash
if ! pgrep -x "filebeat" > /dev/null; then
    echo "Filebeat is not running!"
    sudo systemctl start filebeat
fi

# Check log processing rates
curl -X GET "localhost:5066/stats" | jq '.filebeat.harvester'
```

### Log Rotation
```bash
# /etc/logrotate.d/filebeat
/var/log/filebeat/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload filebeat
    endscript
}
```

## Troubleshooting

### Common Issues
- Network connectivity problems
- Firewall blocking syslog traffic
- Incorrect VPN routing
- Filebeat parsing errors
- Elasticsearch connection failures

### Debugging Commands
```bash
# Test syslog connectivity
logger -n 10.0.1.4 -P 514 "Test message from $(hostname)"

# Monitor Filebeat logs
tail -f /var/log/filebeat/filebeat

# Check network connectivity
nc -u -v 10.0.1.4 514

# Verify VPN connectivity
ping 192.168.1.1
traceroute 192.168.1.1
```

## Performance Optimization

### Filebeat Tuning
```yaml
# Performance optimizations
filebeat.inputs:
- type: syslog
  protocol.udp:
    host: "0.0.0.0:514"
    read_buffer: 65536
    timeout: 300s

queue.mem:
  events: 4096
  flush.min_events: 512
  flush.timeout: 1s

output.elasticsearch:
  bulk_max_size: 1600
  worker: 2
```

## Conclusion

Setting up an Azure-hosted Filebeat syslog relay with VPN connectivity provides a secure, scalable solution for centralized log collection. This architecture enables organizations to collect logs from distributed sources while maintaining security and performance standards.

The combination of Azure's cloud infrastructure and Filebeat's powerful log processing capabilities creates a robust foundation for comprehensive logging strategies.
