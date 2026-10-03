import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const AgriGuardApp());
}

class AgriGuardApp extends StatelessWidget {
  const AgriGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriGuard Farmer',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10b981), // Emerald
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const FarmerDashboard(title: 'Farmer Portal'),
      debugShowCheckedModeBanner: false,
    );
  }
}

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key, required this.title});
  final String title;

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  int _treatmentsLogged = 0;
  bool _isLoading = false;

  // Registered Farmer Contact (Stored in Farmer Profile)
  final String _farmerName = "Rajesh";
  final String _farmerId = "FR10293";
  final String _registeredWhatsApp = "8610528491";
  final bool _whatsappVerified = true;

  // Recent Demo WhatsApp Notifications List
  final List<Map<String, String>> _notifications = [
    {
      "type": "TREATMENT_CREATED",
      "title": "Antibiotic Treatment Notification",
      "tag": "RJ-CW1 (Cow)",
      "medicine": "Oxytetracycline",
      "period": "7 Days",
      "endDate": "23 September 2026",
      "status": "SENT (DEMO)",
      "time": "Today, 10:00 AM"
    },
    {
      "type": "WITHDRAWAL_REMINDER",
      "title": "One-Day Withdrawal Reminder",
      "tag": "RJ-CH-B1 (Chicken)",
      "medicine": "Enrofloxacin",
      "period": "7 Days",
      "endDate": "Tomorrow",
      "status": "REMINDER ACTIVE",
      "time": "Yesterday, 08:30 AM"
    },
    {
      "type": "WITHDRAWAL_COMPLETED",
      "title": "Withdrawal Period Completed",
      "tag": "RJ-GT1 (Goat)",
      "medicine": "Penicillin G + Streptomycin",
      "period": "5 Days",
      "endDate": "Completed",
      "status": "COMPLETED",
      "time": "14 Sep 2026"
    }
  ];

  void _logTreatment() async {
    setState(() { _isLoading = true; });
    // In a real app, this would show a form and POST to the backend
    await Future.delayed(const Duration(seconds: 1)); // Simulate network
    
    setState(() {
      _treatmentsLogged++;
      _isLoading = false;
    });
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Treatment logged & WhatsApp alert triggered!'),
          backgroundColor: Color(0xFF10b981),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            // 1. Existing Counter & Action Section
            Card(
              color: const Color(0xFF0f172a),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF1e293b)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Icon(Icons.pets, size: 48, color: Color(0xFF10b981)),
                    const SizedBox(height: 12),
                    const Text(
                      'Total Treatments Logged Today:',
                      style: TextStyle(fontSize: 16, color: Colors.white70),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$_treatmentsLogged',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_isLoading)
                      const CircularProgressIndicator()
                    else
                      ElevatedButton.icon(
                        onPressed: _logTreatment,
                        icon: const Icon(Icons.add),
                        label: const Text('Log New Treatment'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10b981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 2. WhatsApp Profile & Status Card
            Card(
              color: const Color(0xFF064e3b).withOpacity(0.3),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF059669), width: 1.2),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10b981).withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.message, color: Color(0xFF10b981), size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                '$_farmerName ($_farmerId)',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              const SizedBox(width: 8),
                              if (_whatsappVerified)
                                const Icon(Icons.verified, color: Color(0xFF10b981), size: 18),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Registered WhatsApp: $_registeredWhatsApp',
                            style: const TextStyle(fontSize: 13, color: Color(0xFF6ee7b7)),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Status: Active • Automated Alerts Enabled',
                            style: TextStyle(fontSize: 11, color: Colors.white60),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 3. WhatsApp Notifications Feed (Treatment, Reminder, Completion)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text(
                  'WhatsApp Treatment Alerts',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                Text(
                  'Zero-Emoji Verified',
                  style: TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ],
            ),
            const SizedBox(height: 10),

            ..._notifications.map((notif) {
              final isCompleted = notif["type"] == "WITHDRAWAL_COMPLETED";
              final isReminder = notif["type"] == "WITHDRAWAL_REMINDER";

              final Color badgeColor = isCompleted
                  ? const Color(0xFF10b981)
                  : (isReminder ? const Color(0xFFf59e0b) : const Color(0xFF06b6d4));

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                color: const Color(0xFF1e293b),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: badgeColor.withOpacity(0.4)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              notif["title"]!,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: badgeColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: BorderSide(color: badgeColor.withOpacity(0.3)),
                            ),
                            child: Text(
                              notif["status"]!,
                              style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFF334155), height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Tag: ${notif["tag"]}", style: const TextStyle(fontSize: 12, color: Colors.white70)),
                          Text("Drug: ${notif["medicine"]}", style: const TextStyle(fontSize: 12, color: Color(0xFF67e8f9))),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Hold: ${notif["period"]}", style: const TextStyle(fontSize: 12, color: Color(0xFFfcd34d))),
                          Text("Clearance: ${notif["endDate"]}", style: const TextStyle(fontSize: 12, color: Colors.white70)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}
