const API_BASE = window.location.origin;

const API = {
  async diagnoseLeaf(imageBlobOrBase64, options = {}) {
    try {
      let body;
      let headers = {};

      if (typeof imageBlobOrBase64 === "string") {
        // Base64 JSON
        body = JSON.stringify({
          image: imageBlobOrBase64,
          device_id: options.deviceId || null,
          force_confidence: options.forceConfidence || null
        });
        headers["Content-Type"] = "application/json";
      } else {
        // FormData with file blob
        const formData = new FormData();
        formData.append("file", imageBlobOrBase64, "leaf_scan.jpg");
        if (options.deviceId) formData.append("device_id", options.deviceId);
        if (options.forceConfidence !== undefined && options.forceConfidence !== null) {
          formData.append("force_confidence", options.forceConfidence);
        }
        body = formData;
      }

      const response = await fetch(`${API_BASE}/api/diagnose`, {
        method: "POST",
        headers: headers,
        body: body
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error("[API.diagnoseLeaf] Error:", err);
      throw err;
    }
  },

  async saveScan(scanData) {
    const response = await fetch(`${API_BASE}/api/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scanData)
    });
    if (!response.ok) {
      throw new Error(`Failed to save scan: ${response.status}`);
    }
    return await response.json();
  },

  async getScans(limit = 50) {
    const response = await fetch(`${API_BASE}/api/scans?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch scans: ${response.status}`);
    }
    return await response.json();
  },

  async deleteScan(scanId) {
    const response = await fetch(`${API_BASE}/api/scans/${scanId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error(`Failed to delete scan: ${response.status}`);
    }
    return await response.json();
  },

  async getDevices() {
    const response = await fetch(`${API_BASE}/api/devices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.status}`);
    }
    return await response.json();
  },

  async getDiseases() {
    const response = await fetch(`${API_BASE}/api/diseases`);
    if (!response.ok) {
      throw new Error(`Failed to fetch diseases: ${response.status}`);
    }
    return await response.json();
  }
};
