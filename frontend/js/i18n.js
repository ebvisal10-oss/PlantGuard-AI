const translations = {
  en: {
    app_title: "PlantGuard AI",
    tagline: "Detect Early. Grow Healthier.",
    scan_leaf_cta: "Scan Leaf",
    upload_photo_cta: "Upload Photo",
    sample_leaves_title: "Check Any Crop Leaf:",
    recent_activity: "Recent Activity",
    home: "Home",
    camera: "Camera",
    history: "History",
    devices: "IoT Units",
    
    // Camera HUD
    camera_hud_title: "Foliar Diagnostic HUD",
    framing_tip: "Fill the frame with one leaf",
    steady_tip: "Hold steady • Use natural light",
    live_scan_mode: "Live Scan",
    shutter_capture_mode: "Capture",
    camera_active: "CAMERA LIVE",
    camera_paused: "PAUSED",
    simulated_camera_badge: "TEST STREAM",
    switch_lens: "Flip",
    torch: "Torch",
    zoom: "Zoom",
    test_stream: "Simulate Feed",
    quality_blurry: "Image too blurry, adjust and try again",
    quality_dark: "Image too dark, adjust lighting and try again",
    quality_overexposed: "Image overexposed, move away from harsh glare",
    quality_good: "Optimal framing and lighting",
    scanning_step_1: "Scanning Leaf...",
    scanning_step_2: "AI Analyzing Image...",
    scanning_step_3: "Processing Complete.",
    
    // Result
    result_title: "Diagnostic Report",
    possible_disease: "Possible Disease",
    confidence: "Confidence",
    severity: "Severity",
    spot_analysis: "Infected Spot Localization (Grad-CAM)",
    spots_detected: "lesion spots identified",
    uncertain_warning: "Not sure, retake the photo under clearer lighting or from a closer distance.",
    treatment_guide_title: "Actionable 3-Step Treatment Guide",
    step_1_title: "Step 1: Pruning & Sanitation",
    step_2_title: "Step 2: Airflow & Moisture Control",
    step_3_title: "Step 3: Qualified Local Recommendations",
    safety_gear_notice: "Safety Note: Wear protective gloves, eye protection, and respirator when handling fungicides.",
    krishi_bhavan_notice: "Regional Advisory: Confirm chemical dosages with your local agriculture extension officer (Krishi Bhavan).",
    save_scan_btn: "Save Scan",
    saved_badge: "Saved to History",
    retake_btn: "Retake Photo",
    
    // History & Devices
    history_title: "Scan History",
    no_history: "No saved scans yet. Scan a leaf to get started!",
    devices_title: "Field IoT Units (ESP32-CAM / RPi)",
    devices_desc: "Autonomous field cameras posting real-time foliar telemetry.",
    device_status: "Status",
    battery: "Battery",
    last_ping: "Last Ping",
    latest_diagnosis: "Latest Field Scan",
    curl_guide_title: "Field Unit Ingest API (cURL Example):",
    
    // Errors
    perm_denied_title: "Camera Access Required",
    perm_denied_body: "To scan plant leaves, please allow camera permission in your browser settings, or upload a photo directly.",
    no_cam_title: "No Camera Detected",
    no_cam_body: "We couldn't detect a physical webcam. You can switch to our interactive Leaf Test Stream or upload a photo."
  },
  ml: {
    app_title: "പ്ലാന്റ്ഗാർഡ് AI",
    tagline: "നേരത്തെ കണ്ടെത്തുക. ആരോഗ്യത്തോടെ വളർത്തുക.",
    scan_leaf_cta: "ഇല സ്കാൻ ചെയ്യുക",
    upload_photo_cta: "ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക",
    sample_leaves_title: "വിവിധ വിളകളിലെ ഇലകൾ പരിശോധിക്കുക:",
    recent_activity: "സമീപകാല വിവരങ്ങൾ",
    home: "ഹോം",
    camera: "ക്യാമറ",
    history: "ചരിത്രം",
    devices: "IoT യൂണിറ്റുകൾ",
    
    // Camera HUD
    camera_hud_title: "തത്സമയ രോഗനിർണ്ണയ സ്കാനർ",
    framing_tip: "ഫ്രെയിമിൽ ഒരു ഇല പൂർണ്ണമായി ഉൾക്കൊള്ളിക്കുക",
    steady_tip: "ക്യാമറ അനക്കാതെ പിടിക്കുക • നല്ല വെളിച്ചം ഉപയോഗിക്കുക",
    live_scan_mode: "തത്സമയ സ്കാൻ",
    shutter_capture_mode: "ഫോട്ടോ എടുക്കുക",
    camera_active: "ക്യാമറ സജീവം",
    camera_paused: "താൽക്കാലികമായി നിർത്തി",
    simulated_camera_badge: "ടെസ്റ്റ് സ്ട്രീം",
    switch_lens: "തിരിക്കുക",
    torch: "ലൈറ്റ്",
    zoom: "സൂം",
    test_stream: "ടെസ്റ്റ് മോഡ്",
    quality_blurry: "ചിത്രം വ്യക്തമല്ല, ക്യാമറ അനക്കാതെ വീണ്ടും ശ്രമിക്കുക",
    quality_dark: "വെളിച്ചം കുറവാണ്, വെളിച്ചമുള്ളിടത്തേക്ക് മാറ്റുക",
    quality_overexposed: "അമിത വെളിച്ചം, തണലിലേക്ക് മാറ്റുക",
    quality_good: "നല്ല ദൃശ്യതയും വെളിച്ചവും",
    scanning_step_1: "ഇല സ്കാൻ ചെയ്യുന്നു...",
    scanning_step_2: "AI വിശകലനം നടത്തുന്നു...",
    scanning_step_3: "പരിശോധന പൂർത്തിയായി.",
    
    // Result
    result_title: "രോഗനിർണ്ണയ റിപ്പോർട്ട്",
    possible_disease: "സാധ്യമായ രോഗം",
    confidence: "കൃത്യത (Confidence)",
    severity: "തീവ്രത (Severity)",
    spot_analysis: "രോഗബാധയുള്ള പാടുകൾ (Grad-CAM)",
    spots_detected: "രോഗ ലക്ഷണങ്ങൾ കണ്ടെത്തി",
    uncertain_warning: "തീർച്ചപ്പെടുത്താനായില്ല, നല്ല വെളിച്ചത്തിൽ വീണ്ടും ഫോട്ടോ എടുക്കുക.",
    treatment_guide_title: "3 ഘട്ട പരിചരണ നിർദ്ദേശങ്ങൾ",
    step_1_title: "ഘട്ടം 1: രോഗം ബാധിച്ച ഭാഗങ്ങൾ നീക്കം ചെയ്യുക",
    step_2_title: "ഘട്ടം 2: വായുസഞ്ചാരവും ഈർപ്പവും ക്രമീകരിക്കുക",
    step_3_title: "ഘട്ടം 3: പ്രാദേശിക കാർഷിക ശുപാർശകൾ",
    safety_gear_notice: "സുരക്ഷാ നിർദ്ദേശം: മരുന്ന് തളിക്കുമ്പോൾ കയ്യുറകളും മാസ്കും കണ്ണടയും ധരിക്കുക.",
    krishi_bhavan_notice: "കൂടുതൽ നിർദ്ദേശങ്ങൾക്കായി അടുത്തുള്ള കൃഷിഭവനുമായി ബന്ധപ്പെടുക.",
    save_scan_btn: "സംരക്ഷിക്കുക",
    saved_badge: "സേവ് ചെയ്തു",
    retake_btn: "വീണ്ടും എടുക്കുക",
    
    // History & Devices
    history_title: "സ്കാൻ ഹിസ്റ്ററി",
    no_history: "സംരക്ഷിച്ച സ്കാനുകൾ ലഭ്യമല്ല.",
    devices_title: "ഫീൽഡ് IoT ഉപകരണങ്ങൾ",
    devices_desc: "തോട്ടത്തിൽ സ്ഥാപിച്ച സെൻസർ ക്യാമറകൾ.",
    device_status: "നില",
    battery: "ബാറ്ററി",
    last_ping: "അവസാന സന്ദേശം",
    latest_diagnosis: "ഫീൽഡ് സ്കാൻ വിവരം",
    curl_guide_title: "ഫീൽഡ് ക്യാമറ കണക്റ്റിവിറ്റി (cURL):",
    
    // Errors
    perm_denied_title: "ക്യാമറ അനുമതി ആവശ്യമാണ്",
    perm_denied_body: "ഇലകൾ സ്കാൻ ചെയ്യാൻ ബ്രൗസർ സെറ്റിംഗ്സിൽ ക്യാമറ പെർമിഷൻ നൽകുക അല്ലെങ്കിൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക.",
    no_cam_title: "ക്യാമറ കണ്ടെത്തിയില്ല",
    no_cam_body: "ക്യാമറ ലഭ്യമല്ല. ടെസ്റ്റ് സ്ട്രീം ഉപയോഗിക്കുകയോ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുകയോ ചെയ്യാം."
  }
};

let currentLang = "en";

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) {
        if (el.tagName === "INPUT" && el.getAttribute("placeholder")) {
          el.setAttribute("placeholder", translations[lang][key]);
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });
    
    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) {
      langBtn.textContent = lang === "en" ? "മലയാളം" : "English";
    }
  }
}

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || (translations.en[key] || key);
}
