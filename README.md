# Hybris Environment Switcher Chrome Extension
## Overview
This Chrome extension enhances the workflow for developers and users working with SAP Hybris environments. It provides quick navigation between different Hybris environments, including seamless switching between Backoffice and HAC (Hybris Administration Console) interfaces.

## Features
### Dynamic config import
![image](https://github.com/user-attachments/assets/07c211c2-2643-4d14-a980-becc7616334b)

### Backoffice and HAC Quick Switching
![image](https://github.com/user-attachments/assets/094ee82e-988a-4cae-90b0-2a94d868ec82)
![image](https://github.com/user-attachments/assets/422ddd47-8ece-4bfb-8232-051ec8eaebb5)

### Quick navigation to any site based on cluster and env configured in `config.json`
![image](https://github.com/user-attachments/assets/40d6fb7e-ae54-42bb-80b0-a080b5015f2e)

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to chrome://extensions/.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Configuration
The extension uses a config.json file to determine supported domains and navigation options. You can customize this file to add or modify environments:
```json
{
  "domains": [
    {
      "domain_name": "your-hybris-domain.com",
      "possible_paths": ["path1", "path2"],
      "cluster": "cluster1",
      "env": "env1"
    }
  ],
  "clusters": [
    {
      "id": "cluster1",
      "envs": [
        {
          "id": "env1",
          "options": [
            {
              "title": "Option 1",
              "url": "https://option1-url.com"
            },
            {
              "title": "Option 2",
              "url": "https://option2-url.com"
            }
          ]
        }
      ]
    }
  ]
}
```

## Usage

1. Navigate to a supported Hybris domain.
2. Right-click to open the context menu.
3. Select the desired environment or option from the "Go to" submenu.
4. The extension will either switch to an existing tab or open a new one with the selected environment.

## Know bugs
### Issue1: Options not showing but was showing earlier
Workaround: Try switching to another tab and switch back
### Issue2: Clicking on option does nothing
Workaround: Try switching to another tab and switch back
