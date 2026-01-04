package com.securefinance.admin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initial auto-update check for Admin Dashboard
        AutoUpdateManager updateManager = new AutoUpdateManager(this, "https://emi-pro-app.onrender.com");
        updateManager.checkForUpdates();
    }
}
