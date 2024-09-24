let config;

// Configuration loading
function loadConfig(callback) {
  chrome.storage.local.get("config", (result) => {
    if (result.config) {
      config = result.config;
      console.log("Config loaded from storage:", config);
      callback(config);
    } else {
      fetchAndSaveConfig(callback);
    }
  });
}

function fetchAndSaveConfig(callback) {
  console.log("Fetching config from config.json...");
  fetch(chrome.runtime.getURL("config.json"))
    .then((response) => response.json())
    .then((data) => {
      config = data;
      chrome.storage.local.set({ config: data });
      console.log("Config fetched and stored:", config);
      callback(config);
    })
    .catch((error) => {
      console.error("Error fetching config:", error);
    });
}

// Site detection
function isSupportedSite(url, config) {
  if (!url || !config || !config.domains) {
    console.log("Unsupported URL or missing config:", url, config);
    return null;
  }

  const supportedDomain = findSupportedDomain(url, config.domains);
  if (supportedDomain) return supportedDomain;

  const hybrisDomain = detectHybrisPage(url);
  if (hybrisDomain) return hybrisDomain;

  console.log("No supported domain found for URL:", url.hostname);
  return null;
}

function findSupportedDomain(url, domains) {
  for (const domain of domains) {
    if (isDomainMatch(url, domain)) {
      console.log("Supported domain found:", domain);
      return domain;
    }
  }
  return null;
}

function isDomainMatch(url, domain) {
  const { domain_name, possible_paths } = domain;
  if (url.hostname !== domain_name) return false;
  if (!possible_paths || possible_paths.length === 0) return true;
  return possible_paths.some((path) => {
    const pathSegments = url.pathname.split("/").filter(Boolean);
    return pathSegments[0] === path;
  });
}

function detectHybrisPage(url) {
  if (
    url.pathname.startsWith("/backoffice") ||
    url.pathname.startsWith("/hac")
  ) {
    console.log("Hybris page detected:", url.pathname);
    return {
      type: "hybris",
      path: url.pathname.split("/")[1],
      url: url.toString(),
    };
  }
  return null;
}

// Option generation
function getOptions(domain, config) {
  if (!domain) return [];

  if (domain.type === "hybris") {
    return getHybrisOptions(domain);
  }

  return getConfigOptions(domain, config);
}

function getHybrisOptions(domain) {
  const url = new URL(domain.url);
  const baseUrl = `${url.protocol}//${url.hostname}`;
  if (domain.path === "backoffice") {
    return [{ title: "Go to HAC", url: `${baseUrl}/hac` }];
  } else if (domain.path === "hac") {
    return [{ title: "Go to Backoffice", url: `${baseUrl}/backoffice` }];
  }
  return [];
}

function getConfigOptions(domain, config) {
  if (!config || !config.clusters) return [];

  const cluster = config.clusters.find((c) => c.id === domain.cluster);
  if (!cluster) return [];

  const env = cluster.envs.find((e) => e.id === domain.env);
  if (!env) return [];

  console.log("Options for supported domain:", env.options);
  return env.options || [];
}

// Context menu management
function updateContextMenuForUrl(url, tabId) {
  loadConfig((config) => {
    try {
      const urlObject = new URL(url);
      const supportedDomain = isSupportedSite(urlObject, config);
      updateContextMenuBasedOnDomain(supportedDomain, config, tabId);
    } catch (error) {
      console.error("Error processing URL:", error);
      chrome.contextMenus.removeAll();
    }
  });
}

function updateContextMenuBasedOnDomain(supportedDomain, config, tabId) {
  chrome.contextMenus.removeAll(() => {
    if (supportedDomain) {
      const options = getOptions(supportedDomain, config);
      createContextMenu(options, tabId);
    } else {
      console.log("No supported domain, context menu removed.");
    }
  });
}

function createContextMenu(options, tabId) {
  if (options && options.length > 0) {
    chrome.contextMenus.create({
      id: `gotoMenu_${tabId}`,
      title: "Go to",
      contexts: ["all"],
    });

    options.forEach((option) => {
      try {
        chrome.contextMenus.create({
          id: `${option.title}_${tabId}`,
          parentId: `gotoMenu_${tabId}`,
          title: option.title,
          contexts: ["all"],
        });
      } catch (error) {
        console.log("Error creating context menu item:", error);
      }
    });
  }
}

// Event listeners
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    !tab.url.startsWith("chrome://")
  ) {
    checkIfActiveTabAndUpdate(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && !tab.url.startsWith("chrome://")) {
      updateContextMenuForUrl(tab.url, tab.id);
    } else {
      chrome.contextMenus.removeAll();
      console.log(
        "Tab activated, but no valid URL found. Context menu removed."
      );
    }
  });
});

function checkIfActiveTabAndUpdate(tabId, url) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.id === tabId) {
      console.log(
        "Tab update completed in the active tab. Updating context menu for URL:",
        url
      );
      updateContextMenuForUrl(url, tabId);
    } else {
      console.log("Tab update completed in a background tab. Ignoring.");
    }
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "gotoMenu" && tab && tab.url) {
    handleContextMenuClick(info, tab);
  }
});

function handleContextMenuClick(info, tab) {
  try {
    const urlObject = new URL(tab.url);
    const supportedDomain = isSupportedSite(urlObject, config);
    if (supportedDomain) {
      const options = getOptions(supportedDomain, config);
      const selectedOption = options.find(
        (opt) => `${opt.title}_${tab.id}` === info.menuItemId
      );
      if (selectedOption) {
        console.log("Selected option:", selectedOption.url);
        switchToTabOrCreate(selectedOption.url);
      }
    }
  } catch (error) {
    console.log("Error processing URL from context menu click:", error);
  }
}

function switchToTabOrCreate(url) {
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(tab => tab.url.startsWith(url));
    if (existingTab) {
      console.log("Switching to existing tab:", existingTab.id);
      chrome.tabs.update(existingTab.id, { active: true });
      chrome.windows.update(existingTab.windowId, { focused: true });
    } else {
      console.log("Opening new tab with URL:", url);
      chrome.tabs.create({ url: url });
    }
  });
}

// Config import handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "importConfig") {
    importConfig(request.config, sendResponse);
    return true; // Indicates that the response is sent asynchronously
  }
});

function importConfig(newConfig, sendResponse) {
  config = newConfig;
  chrome.storage.local.set({ config: newConfig }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error saving imported config:", chrome.runtime.lastError);
      sendResponse({ success: false });
    } else {
      console.log("Imported config saved successfully:", newConfig);
      refreshAllTabs();
      sendResponse({ success: true });
    }
  });
}

function refreshAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url && !tab.url.startsWith("chrome://")) {
        updateContextMenuForUrl(tab.url, tab.id);
      }
    });
  });
}

console.log("Background script loaded");
