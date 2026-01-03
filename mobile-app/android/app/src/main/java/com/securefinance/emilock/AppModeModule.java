package com.securefinance.emilock;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import java.util.HashMap;
import java.util.Map;

public class AppModeModule extends ReactContextBaseJavaModule {

    AppModeModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "AppMode";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("MODE", BuildConfig.APP_MODE);
        return constants;
    }
}
