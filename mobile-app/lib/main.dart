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
          content: Text('Treatment logged successfully to ledger!'),
          backgroundColor: Colors.green,
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
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Icon(Icons.pets, size: 64, color: Colors.emerald),
            const SizedBox(height: 16),
            const Text(
              'Total Treatments Logged Today:',
              style: TextStyle(fontSize: 18),
            ),
            Text(
              '$_treatmentsLogged',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 32),
            if (_isLoading)
              const CircularProgressIndicator()
            else
              ElevatedButton.icon(
                onPressed: _logTreatment,
                icon: const Icon(Icons.add),
                label: const Text('Log New Treatment'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  textStyle: const TextStyle(fontSize: 18),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
