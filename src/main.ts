import { once, showUI, emit } from '@create-figma-plugin/utilities'

import { CloseHandler, StartHandler, ProgressHandler, IconCountHandler } from './types'

import aliases from './aliases.json'
import * as fuzz from "fuzzball"

export default function () {
  once<StartHandler>('START', function () {

    function normalizeIconName(name: string) {
      let iconName = name.substring(name.lastIndexOf('/') + 1);
      iconName = iconName.substring(iconName.indexOf(':') + 1);
      iconName = iconName.replace(/[-\s]/g, '_').toLowerCase();
      if (iconName.startsWith('ic_') || iconName.startsWith('icon_')) {
        iconName = iconName.substring(iconName.indexOf('_') + 1);
      }
      return iconName;
    }

    async function matchIconName_updateDescInChunks(
      icons: any[],
      aliases: { [key: string]: string[] }
    ) {
      const matchedIconNames: string[] = [];
      const unmatchedIconNames: string[] = [];
    
      const options = {
        scorer: fuzz.token_sort_ratio, // Adjust if using another fuzz library
        full_process: true,
        limit: 1,
        cutoff: 75,
        sortBySimilarity: false,
      };
    
      const chunkSize = 1; // Number of icons to process per chunk
      let progressCount = 0; // Counter to keep track of progress

      for (let i = 0; i < icons.length; i += chunkSize) {
        const chunk = icons.slice(i, i + chunkSize);

        for (const icon of chunk) {
          let iconName = normalizeIconName(icon.name);
    
          const match = fuzz.extract(iconName, Object.keys(aliases), options);
          console.log(match[0]);

          if (match.length === 0) {
            let matchValues = fuzz.extract(iconName, Object.values(aliases).flat(), options);
            if (matchValues.length === 0) {
              unmatchedIconNames.push(iconName);
            } else {
              const matched_key =
                Object.keys(aliases).find((key) =>
                  aliases[key].includes(matchValues[0][0])
                ) ?? "Key not found";
              icon.description =
                icon.description +
                "\n" +
                "Aliases: " +
                aliases[matched_key].join(", ");
              matchedIconNames.push(
                `${matched_key} : ${iconName} : ${matchValues[0][1]}`
              );
            }
          } else {
            const matched_key = match[0][0];
            icon.description =
              icon.description +
              "\n" +
              "Aliases: " +
              aliases[matched_key].join(", ");
            matchedIconNames.push(
              `${matched_key} : ${iconName} : ${match[0][1]}`
            );
          }
          
          progressCount += 1;

          emit<ProgressHandler>('PROGRESS', progressCount)
        }
        
        // Yield to the main thread after processing a chunk
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    
    let iconCount = 0;
    let icons: any[] = []; 
    
    async function findIconsInChunks(rootNode: any) {
      let queue: any[] = [rootNode]; // Start with the root node
      const chunkSize = 250; // Number of nodes to process per chunk
    
      while (queue.length > 0) {
        const chunk = queue.splice(0, chunkSize); // Get a chunk of nodes
        for (const node of chunk) {
          if ("children" in node) {
            for (const child of node.children) {
              // Process ComponentSets (potential icons)
              if (child.type === "COMPONENT_SET") {
                let isIcon = true;
                for (const grandChild of child.children) {
                  if (grandChild.height !== grandChild.width || grandChild.width > 48) {
                    isIcon = false;
                    break;
                  }
                }
                if (isIcon) {
                  iconCount++;
                  icons.push(child);
                }
              }
    
              // Process single COMPONENT nodes
              else if (child.type === "COMPONENT" && child.height === child.width && child.width <= 48) {
                iconCount++;
                icons.push(child);
              }

              else {
                queue.push(child); // Add children to the queue for future processing
              }
            }
          }
        }
    
        // Yield to the main thread to keep UI responsive
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
    
    // figma.loadAllPagesAsync() // ensures all PageNodes are loaded, can be slow in very large files

    // Call the function
    findIconsInChunks(figma.currentPage).then(() => {

      if (iconCount === 0) {
        figma.notify('No icons found! Make sure you run from the page containing your Icon components.', { timeout:10000, error: true });
        figma.closePlugin();
      }
      else {
        figma.notify(`Found ${iconCount} icons!`)
        
        // log the icon names of every icon found in a single list
        // let iconNames = icons.map(icon => icon.name);
        // console.log(iconNames);
        
        emit<IconCountHandler>('ICON_COUNT', iconCount);

        // Call the function matchIconName_updateDesc with the list of icons and aliases as input.
        matchIconName_updateDescInChunks(icons, aliases)
      }
    });

  })
  once<CloseHandler>('CLOSE', function () {
    figma.closePlugin()
  })
  showUI({
    height: 170,
    width: 360
  })
}
