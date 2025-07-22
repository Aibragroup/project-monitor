// Global variables
let devices = [];
let analyticsChart = null;
let deviceTypes = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadDeviceTypes();
    loadDevices();
    setupEventListeners();
    
    // Auto-refresh data every 10 seconds
    setInterval(loadDevices, 10000);
});

// Setup event listeners
function setupEventListeners() {
    // Analytics controls
    document.getElementById('analytics-device').addEventListener('change', updateAnalyticsChart);
    document.getElementById('analytics-metric').addEventListener('change', updateAnalyticsChart);
    
    // Add device form
    document.getElementById('add-device-form').addEventListener('submit', handleAddDevice);
    
    // Device type change handler
    document.getElementById('device-type').addEventListener('change', updateDeviceMetrics);
}

// Load device types
async function loadDeviceTypes() {
    try {
        const response = await fetch('/api/device-types');
        deviceTypes = await response.json();
        updateDeviceMetrics(); // Initialize with default type
    } catch (error) {
        console.error('Error loading device types:', error);
    }
}

// Update device metrics based on selected type
function updateDeviceMetrics() {
    const deviceType = document.getElementById('device-type').value;
    const typeConfig = deviceTypes[deviceType];
    const container = document.getElementById('device-metrics-container');
    const description = document.getElementById('device-type-description');
    const metricsInfo = document.getElementById('metrics-info');
    
    if (!typeConfig) return;
    
    description.textContent = getDeviceTypeDescription(deviceType);
    metricsInfo.textContent = `Configure metrics specific to ${typeConfig.name}`;
    
    container.innerHTML = '';
    
    typeConfig.metrics.forEach(metric => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label class="block text-xs text-gray-400 mb-1">${getMetricLabel(metric)}</label>
            <input type="number" 
                   id="metric-${metric}" 
                   step="0.1" 
                   value="${getDefaultValueForMetric(metric)}" 
                   class="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm">
        `;
        container.appendChild(div);
    });
}

function getDeviceTypeDescription(type) {
    const descriptions = {
        router: 'Network routing device',
        switch: 'Network switching device',
        firewall: 'Network security device',
        wireless_ap: 'Wireless network access point',
        load_balancer: 'Traffic load balancing device',
        gateway: 'Network gateway device',
        proxy_server: 'Network proxy server',
        modem: 'Network modem device',
        ids_ips: 'Intrusion Detection/Prevention System',
        voip_gateway: 'Voice over IP gateway',
        repeater: 'Signal repeater device',
        bridge: 'Network bridge device',
        nas: 'Network Attached Storage',
        vpn_concentrator: 'VPN connection concentrator'
    };
    return descriptions[type] || 'Network device';
}

function getMetricLabel(metric) {
    const labels = {
        cpu_usage: 'CPU Usage (%)',
        memory_usage: 'Memory Usage (%)',
        interface_bandwidth: 'Interface Bandwidth (Mbps)',
        routing_table_changes: 'Routing Table Changes',
        packet_loss: 'Packet Loss (%)',
        latency: 'Latency (ms)',
        port_status: 'Port Status (%)',
        traffic_per_port: 'Traffic per Port (Mbps)',
        broadcast_storms: 'Broadcast Storms',
        mac_table_size: 'MAC Table Size (%)',
        error_packets: 'Error Packets',
        active_sessions: 'Active Sessions',
        blocked_traffic: 'Blocked Traffic (%)',
        vpn_tunnels: 'VPN Tunnels',
        threat_detection: 'Threat Detections',
        connected_clients: 'Connected Clients',
        signal_strength: 'Signal Strength (dBm)',
        channel_utilization: 'Channel Utilization (%)',
        packet_retransmissions: 'Packet Retransmissions',
        bandwidth_usage: 'Bandwidth Usage (%)',
        active_connections: 'Active Connections',
        server_response_time: 'Server Response Time (ms)',
        throughput: 'Throughput (Mbps)',
        failed_health_checks: 'Failed Health Checks',
        traffic_distribution: 'Traffic Distribution (%)',
        traffic_forwarding_rate: 'Traffic Forwarding Rate (%)',
        protocol_translations: 'Protocol Translations',
        cpu_load: 'CPU Load (%)',
        dropped_packets: 'Dropped Packets',
        cache_hit_ratio: 'Cache Hit Ratio (%)',
        concurrent_connections: 'Concurrent Connections',
        response_time: 'Response Time (ms)',
        blocked_requests: 'Blocked Requests',
        line_status: 'Line Status (%)',
        snr: 'Signal-to-Noise Ratio (dB)',
        upstream_rate: 'Upstream Rate (Mbps)',
        downstream_rate: 'Downstream Rate (Mbps)',
        connection_uptime: 'Connection Uptime (%)',
        error_rates: 'Error Rates (%)',
        detected_threats: 'Detected Threats',
        false_positives: 'False Positives',
        signature_updates: 'Signature Updates (%)',
        active_calls: 'Active Calls',
        call_quality_mos: 'Call Quality (MOS)',
        packet_jitter: 'Packet Jitter (ms)',
        call_success_rate: 'Call Success Rate (%)',
        call_failure_rate: 'Call Failure Rate (%)',
        codec_utilization: 'Codec Utilization (%)',
        signal_amplification: 'Signal Amplification (%)',
        input_error_rate: 'Input Error Rate (%)',
        output_error_rate: 'Output Error Rate (%)',
        link_uptime: 'Link Uptime (%)',
        mac_filtering: 'MAC Filtering (%)',
        packet_forwarding_rate: 'Packet Forwarding Rate (%)',
        collision_rates: 'Collision Rates (%)',
        disk_usage: 'Disk Usage (%)',
        read_throughput: 'Read Throughput (MB/s)',
        write_throughput: 'Write Throughput (MB/s)',
        disk_temperature: 'Disk Temperature (°C)',
        error_logs: 'Error Logs',
        active_vpn_sessions: 'Active VPN Sessions',
        authentication_failures: 'Authentication Failures',
        encryption_performance: 'Encryption Performance (%)'
    };
    return labels[metric] || metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getDefaultValueForMetric(metric) {
    const defaults = {
        cpu_usage: 25, memory_usage: 40, interface_bandwidth: 80, routing_table_changes: 5,
        packet_loss: 0.1, latency: 15, port_status: 95, traffic_per_port: 60,
        broadcast_storms: 2, mac_table_size: 70, error_packets: 10, active_sessions: 150,
        blocked_traffic: 25, vpn_tunnels: 8, threat_detection: 12, connected_clients: 45,
        signal_strength: 85, channel_utilization: 65, packet_retransmissions: 3,
        bandwidth_usage: 70, active_connections: 200, server_response_time: 120,
        throughput: 85, failed_health_checks: 2, traffic_distribution: 80,
        traffic_forwarding_rate: 90, protocol_translations: 50, cpu_load: 30,
        dropped_packets: 5, cache_hit_ratio: 75, concurrent_connections: 180,
        response_time: 95, blocked_requests: 15, line_status: 98, snr: 35,
        upstream_rate: 50, downstream_rate: 100, connection_uptime: 99,
        error_rates: 0.5, detected_threats: 8, false_positives: 3,
        signature_updates: 95, active_calls: 25, call_quality_mos: 4.2,
        packet_jitter: 8, call_success_rate: 98, call_failure_rate: 2,
        codec_utilization: 60, signal_amplification: 85, input_error_rate: 0.2,
        output_error_rate: 0.3, link_uptime: 99.5, mac_filtering: 90,
        packet_forwarding_rate: 95, collision_rates: 1, disk_usage: 65,
        read_throughput: 120, write_throughput: 80, disk_temperature: 42,
        error_logs: 5, active_vpn_sessions: 35, authentication_failures: 3,
        encryption_performance: 88
    };
    return defaults[metric] || 50;
}

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('bg-white', 'text-gray-800');
        button.classList.add('text-gray-300', 'hover:text-white', 'hover:bg-gray-700');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}-content`).classList.remove('hidden');
    
    // Add active class to selected tab button
    const activeButton = document.getElementById(`tab-${tabName}`);
    activeButton.classList.add('bg-white', 'text-gray-800');
    activeButton.classList.remove('text-gray-300', 'hover:text-white', 'hover:bg-gray-700');
    
    // Load specific data for the tab
    if (tabName === 'analytics') {
        populateAnalyticsDevices();
        updateAnalyticsChart();
    } else if (tabName === 'maintenance') {
        loadMaintenanceData();
    }
}

// Load devices from API
async function loadDevices() {
    try {
        const response = await fetch('/api/devices');
        devices = await response.json();
        
        updateDashboard();
        updateDevicesGrid();
        populateAnalyticsDevices();
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

// Update dashboard statistics with real data
function updateDashboard() {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const totalAlerts = devices.reduce((sum, device) => sum + device.alerts.filter(a => !a.resolved).length, 0);
    const avgHealthScore = totalDevices > 0 
        ? Math.round(devices.reduce((sum, device) => sum + device.predictiveScore, 0) / totalDevices)
        : 0;
    
    const uptimePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
    
    document.getElementById('total-devices').textContent = totalDevices;
    document.getElementById('online-devices').textContent = onlineDevices;
    document.getElementById('total-alerts').textContent = totalAlerts;
    document.getElementById('avg-health-score').textContent = `${avgHealthScore}%`;
    
    // Update change indicators with real data
    document.getElementById('total-devices-change').textContent = `${totalDevices} network devices`;
    document.getElementById('uptime-percentage').textContent = `${uptimePercentage}% uptime`;
    document.getElementById('alerts-status').textContent = totalAlerts === 0 ? 'All systems normal' : 'Requires attention';
    document.getElementById('health-status').textContent = 
        avgHealthScore > 70 ? 'Good health' : 
        avgHealthScore > 40 ? 'Fair health' : 'Poor health';
    
    updateStatusDistribution();
    updateRecentAlerts();
}

// Update status distribution
function updateStatusDistribution() {
    const statusCounts = {
        online: devices.filter(d => d.status === 'online').length,
        warning: devices.filter(d => d.status === 'warning').length,
        critical: devices.filter(d => d.status === 'critical').length,
        offline: devices.filter(d => d.status === 'offline').length
    };
    
    const statusColors = {
        online: 'text-green-500',
        warning: 'text-orange-500',
        critical: 'text-red-500',
        offline: 'text-gray-500'
    };
    
    const statusIcons = {
        online: 'wifi',
        warning: 'alert-triangle',
        critical: 'x-circle',
        offline: 'clock'
    };
    
    const container = document.getElementById('status-distribution');
    container.innerHTML = '';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <i data-lucide="${statusIcons[status]}" class="w-5 h-5 ${statusColors[status]}"></i>
                <span class="text-gray-300 capitalize">${status}</span>
            </div>
            <span class="text-white font-semibold">${count}</span>
        `;
        container.appendChild(div);
    });
    
    lucide.createIcons();
}

// Update recent alerts
function updateRecentAlerts() {
    const recentAlerts = devices
        .flatMap(device => device.alerts.map(alert => ({ ...alert, deviceName: device.name })))
        .filter(alert => !alert.resolved)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const container = document.getElementById('recent-alerts');
    container.innerHTML = '';
    
    if (recentAlerts.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-4">No active alerts</div>';
        return;
    }
    
    recentAlerts.forEach(alert => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-700 rounded-lg';
        
        const alertColor = alert.type === 'critical' ? 'text-red-500' : 
                          alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500';
        
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <i data-lucide="alert-triangle" class="w-5 h-5 ${alertColor}"></i>
                <div>
                    <p class="text-white font-medium">${alert.message}</p>
                    <p class="text-gray-400 text-sm">${alert.deviceName}</p>
                </div>
            </div>
            <div class="text-right">
                <div class="text-xs text-gray-400">
                    ${new Date(alert.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
    
    lucide.createIcons();
}

// Update devices grid
function updateDevicesGrid() {
    const container = document.getElementById('devices-grid');
    container.innerHTML = '';
    
    devices.forEach(device => {
        const div = document.createElement('div');
        div.className = 'bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors';
        
        const statusColor = getStatusColor(device.status);
        const activeAlerts = device.alerts.filter(a => !a.resolved).length;
        const deviceTypeConfig = deviceTypes[device.type];
        const typeName = deviceTypeConfig ? deviceTypeConfig.name : device.type;
        
        // Display key metrics for this device type
        let metricsHtml = '';
        if (device.metrics && deviceTypeConfig) {
            const keyMetrics = deviceTypeConfig.metrics.slice(0, 4); // Show first 4 metrics
            keyMetrics.forEach(metric => {
                if (device.metrics[metric] !== undefined) {
                    const icon = getMetricIcon(metric);
                    const color = getMetricColor(metric);
                    const unit = getMetricUnit(metric);
                    metricsHtml += `
                        <div class="flex items-center space-x-2">
                            <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i>
                            <span class="text-white text-sm">${device.metrics[metric]}${unit}</span>
                        </div>
                    `;
                }
            });
        }
        
        div.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${statusColor}"></div>
                    <h3 class="text-lg font-semibold text-white">${device.name}</h3>
                </div>
                <button onclick="deleteDevice('${device.id}')" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            
            <div class="space-y-3 mb-4">
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Type</span>
                    <span class="text-white">${typeName}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Location</span>
                    <span class="text-white">${device.location}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Status</span>
                    <span class="text-white capitalize">${device.status}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Last Seen</span>
                    <span class="text-white text-sm">${new Date(device.lastSeen).toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="border-t border-gray-700 pt-4">
                <h4 class="text-sm font-medium text-gray-300 mb-3">Key Metrics</h4>
                <div class="grid grid-cols-2 gap-3">
                    ${metricsHtml}
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-700">
                <div class="flex items-center justify-between">
                    <span class="text-gray-400 text-sm">Health Score</span>
                    <div class="flex items-center space-x-2">
                        <div class="w-16 bg-gray-700 rounded-full h-2">
                            <div class="h-full rounded-full ${getHealthScoreColor(device.predictiveScore)}" 
                                 style="width: ${device.predictiveScore}%"></div>
                        </div>
                        <span class="text-white text-sm">${device.predictiveScore}%</span>
                    </div>
                </div>
            </div>
            
            ${activeAlerts > 0 ? `
                <div class="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <div class="flex items-center space-x-2">
                        <i data-lucide="alert-triangle" class="w-4 h-4 text-red-500"></i>
                        <span class="text-red-400 text-sm">${activeAlerts} Active Alert(s)</span>
                    </div>
                </div>
            ` : ''}
        `;
        
        container.appendChild(div);
    });
    
    lucide.createIcons();
}

function getMetricIcon(metric) {
    const icons = {
        cpu_usage: 'cpu', cpu_load: 'cpu', memory_usage: 'hard-drive',
        interface_bandwidth: 'wifi', bandwidth_usage: 'wifi', throughput: 'wifi',
        packet_loss: 'alert-triangle', latency: 'clock', response_time: 'clock',
        active_sessions: 'users', active_connections: 'users', connected_clients: 'users',
        signal_strength: 'signal', disk_usage: 'hard-drive', error_packets: 'alert-circle',
        threat_detection: 'shield', blocked_traffic: 'shield', active_calls: 'phone'
    };
    return icons[metric] || 'activity';
}

function getMetricColor(metric) {
    const colors = {
        cpu_usage: 'text-purple-500', cpu_load: 'text-purple-500', memory_usage: 'text-blue-500',
        interface_bandwidth: 'text-green-500', bandwidth_usage: 'text-green-500', throughput: 'text-green-500',
        packet_loss: 'text-red-500', latency: 'text-orange-500', response_time: 'text-orange-500',
        active_sessions: 'text-cyan-500', active_connections: 'text-cyan-500', connected_clients: 'text-cyan-500',
        signal_strength: 'text-yellow-500', disk_usage: 'text-indigo-500', error_packets: 'text-red-500',
        threat_detection: 'text-red-500', blocked_traffic: 'text-red-500', active_calls: 'text-green-500'
    };
    return colors[metric] || 'text-gray-500';
}

function getMetricUnit(metric) {
    const units = {
        cpu_usage: '%', cpu_load: '%', memory_usage: '%', interface_bandwidth: 'Mbps',
        bandwidth_usage: '%', throughput: 'Mbps', packet_loss: '%', latency: 'ms',
        response_time: 'ms', signal_strength: 'dBm', disk_usage: '%', snr: 'dB',
        upstream_rate: 'Mbps', downstream_rate: 'Mbps', connection_uptime: '%',
        call_quality_mos: '', disk_temperature: '°C'
    };
    return units[metric] || '';
}

// Populate analytics device dropdown
function populateAnalyticsDevices() {
    const select = document.getElementById('analytics-device');
    select.innerHTML = '<option value="">Select Device</option>';
    
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = device.name;
        select.appendChild(option);
    });
}

// Update analytics chart
async function updateAnalyticsChart() {
    const deviceId = document.getElementById('analytics-device').value;
    const metric = document.getElementById('analytics-metric').value;
    
    if (!deviceId || !metric) return;
    
    try {
        const response = await fetch(`/api/analytics/${deviceId}/${metric}`);
        const data = await response.json();
        
        const ctx = document.getElementById('analytics-chart').getContext('2d');
        
        if (analyticsChart) {
            analyticsChart.destroy();
        }
        
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
                datasets: [{
                    label: getMetricLabel(metric),
                    data: data.map(d => d.value),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgb(156, 163, 175)'
                        },
                        grid: {
                            color: 'rgb(55, 65, 81)'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'rgb(156, 163, 175)'
                        },
                        grid: {
                            color: 'rgb(55, 65, 81)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// Load maintenance data
async function loadMaintenanceData() {
    try {
        const response = await fetch('/api/predictive-maintenance');
        const insights = await response.json();
        
        const highRisk = insights.filter(i => i.riskLevel === 'high').length;
        const mediumRisk = insights.filter(i => i.riskLevel === 'medium').length;
        const avgScore = Math.round(insights.reduce((sum, i) => sum + i.predictiveScore, 0) / insights.length) || 0;
        const totalCost = insights.reduce((sum, i) => sum + i.estimatedCost, 0);
        
        document.getElementById('high-risk-count').textContent = highRisk;
        document.getElementById('medium-risk-count').textContent = mediumRisk;
        document.getElementById('maintenance-avg-score').textContent = `${avgScore}%`;
        document.getElementById('maintenance-cost').textContent = `${totalCost.toLocaleString()} TZS`;
        
        updateMaintenanceRecommendations(insights);
    } catch (error) {
        console.error('Error loading maintenance data:', error);
    }
}

// Update maintenance recommendations
function updateMaintenanceRecommendations(insights) {
    const container = document.getElementById('maintenance-recommendations');
    container.innerHTML = '';
    
    const priorityInsights = insights
        .filter(i => i.riskLevel === 'high' || i.riskLevel === 'medium')
        .sort((a, b) => a.predictiveScore - b.predictiveScore)
        .slice(0, 5);
    
    if (priorityInsights.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-4">All devices are performing well</div>';
        return;
    }
    
    priorityInsights.forEach(insight => {
        const div = document.createElement('div');
        div.className = 'p-4 bg-gray-700 rounded-lg';
        
        const riskColor = insight.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                         insight.riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                         'bg-green-500/20 text-green-400';
        
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-white">${insight.deviceName}</h4>
                <span class="px-2 py-1 rounded text-xs font-medium ${riskColor}">
                    ${insight.riskLevel.toUpperCase()} RISK
                </span>
            </div>
            <p class="text-gray-300 text-sm mb-2">${insight.recommendedAction}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
                <span>Health Score: ${insight.predictiveScore}%</span>
                <span>Cost: ${insight.estimatedCost.toLocaleString()} TZS</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Device form management
function showAddDeviceForm() {
    document.getElementById('add-device-modal').classList.remove('hidden');
    updateDeviceMetrics(); // Initialize metrics for default device type
}

function hideAddDeviceForm() {
    document.getElementById('add-device-modal').classList.add('hidden');
    document.getElementById('add-device-form').reset();
}

// Handle add device form submission
async function handleAddDevice(e) {
    e.preventDefault();
    
    const deviceType = document.getElementById('device-type').value;
    const typeConfig = deviceTypes[deviceType];
    
    // Collect metrics
    const metrics = {};
    if (typeConfig) {
        typeConfig.metrics.forEach(metric => {
            const input = document.getElementById(`metric-${metric}`);
            if (input) {
                metrics[metric] = parseFloat(input.value) || 0;
            }
        });
    }
    
    const formData = {
        name: document.getElementById('device-name').value,
        type: deviceType,
        location: document.getElementById('device-location').value,
        status: document.getElementById('device-status').value,
        metrics: metrics
    };
    
    try {
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            hideAddDeviceForm();
            loadDevices();
        }
    } catch (error) {
        console.error('Error adding device:', error);
    }
}

// Delete device
async function deleteDevice(deviceId) {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
        const response = await fetch(`/api/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadDevices();
        }
    } catch (error) {
        console.error('Error deleting device:', error);
    }
}

// Utility functions
function getStatusColor(status) {
    switch (status) {
        case 'online': return 'bg-green-500';
        case 'offline': return 'bg-gray-500';
        case 'warning': return 'bg-orange-500';
        case 'critical': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
}

function getHealthScoreColor(score) {
    if (score > 70) return 'bg-green-500';
    if (score > 40) return 'bg-orange-500';
    return 'bg-red-500';
}