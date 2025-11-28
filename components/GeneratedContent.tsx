
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef} from 'react';
import {InteractionData} from '../types';

interface GeneratedContentProps {
  htmlContent: string;
  onInteract: (data: InteractionData) => void;
  appContext: string | null;
  isLoading: boolean; // Added isLoading prop
}

export const GeneratedContent: React.FC<GeneratedContentProps> = ({
  htmlContent,
  onInteract,
  appContext,
  isLoading,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const processedHtmlContentRef = useRef<string | null>(null); // Ref to track processed content

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // --- Click Handling ---
    const handleClick = (event: MouseEvent) => {
      let targetElement = event.target as HTMLElement;

      while (
        targetElement &&
        targetElement !== container &&
        !targetElement.dataset.interactionId
      ) {
        targetElement = targetElement.parentElement as HTMLElement;
      }

      if (targetElement && targetElement.dataset.interactionId) {
        event.preventDefault();

        let interactionValue: string | undefined =
          targetElement.dataset.interactionValue;

        if (targetElement.dataset.valueFrom) {
          const inputElement = document.getElementById(
            targetElement.dataset.valueFrom,
          ) as HTMLInputElement | HTMLTextAreaElement;
          if (inputElement) {
            interactionValue = inputElement.value;
          }
        }

        const interactionData: InteractionData = {
          id: targetElement.dataset.interactionId,
          type: targetElement.dataset.interactionType || 'generic_click',
          value: interactionValue,
          elementType: targetElement.tagName.toLowerCase(),
          elementText: (
            targetElement.innerText ||
            (targetElement as HTMLInputElement).value ||
            ''
          )
            .trim()
            .substring(0, 75),
          appContext: appContext,
        };
        onInteract(interactionData);
      }
    };

    // --- Drag and Drop Handling ---
    const handleDragStart = (event: DragEvent) => {
      let targetElement = event.target as HTMLElement;

      // Find the closest draggable element with an interaction ID
      while (
        targetElement &&
        targetElement !== container &&
        (!targetElement.dataset.interactionId || targetElement.getAttribute('draggable') !== 'true')
      ) {
        targetElement = targetElement.parentElement as HTMLElement;
      }

      if (targetElement && targetElement.dataset.interactionId && targetElement.getAttribute('draggable') === 'true') {
        // Set the ID of the dragged item
        event.dataTransfer?.setData('text/plain', targetElement.dataset.interactionId);
        event.dataTransfer!.effectAllowed = 'move';
      }
    };

    const handleDragOver = (event: DragEvent) => {
      // Allow drop by preventing default behavior
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const sourceId = event.dataTransfer?.getData('text/plain');
      if (!sourceId) return;

      let targetElement = event.target as HTMLElement;

      // Find drop target
      while (
        targetElement &&
        targetElement !== container &&
        !targetElement.dataset.interactionId
      ) {
        targetElement = targetElement.parentElement as HTMLElement;
      }

      if (targetElement && targetElement.dataset.interactionId) {
        // Prevent dropping onto itself
        if (targetElement.dataset.interactionId === sourceId) return;

        const interactionData: InteractionData = {
          id: targetElement.dataset.interactionId, // Target (e.g., Folder ID)
          type: 'drop',
          value: sourceId, // Source (e.g., File ID being moved)
          elementType: targetElement.tagName.toLowerCase(),
          elementText: (targetElement.innerText || '').trim().substring(0, 75),
          appContext: appContext,
        };
        onInteract(interactionData);
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    // Process scripts only when loading is complete and content has changed
    if (!isLoading) {
      if (htmlContent !== processedHtmlContentRef.current) {
        const scripts = Array.from(container.getElementsByTagName('script'));
        scripts.forEach((scriptNode) => {
          const oldScript = scriptNode as HTMLScriptElement;
          try {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) =>
              newScript.setAttribute(attr.name, attr.value),
            );
            
            // Clean up script content
            let scriptText = oldScript.innerHTML;
            
            // 1. Remove Markdown code blocks (start and end)
            scriptText = scriptText.replace(/^\s*```(?:javascript|js)?\s*/i, ''); 
            scriptText = scriptText.replace(/\s*```\s*$/i, '');
            
            // 2. Decode common HTML entities. 
            // LLMs sometimes output &quot; instead of " inside script tags when generating HTML.
            scriptText = scriptText
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");

            // 3. Safety check for HTML tags at the start (common hallucination)
            if (scriptText.trim().match(/^<[a-zA-Z]/)) {
               console.warn("Skipping script execution because it starts with an HTML tag:", scriptText.substring(0, 50));
               newScript.text = "/* Script skipped due to invalid syntax (HTML detected) */";
            } else {
               // 4. Wrap in IIFE with try-catch
               // IMPORTANT: We use string concatenation instead of template literals for the wrapper
               // because scriptText might contain backticks, which would break the template literal syntax.
               newScript.textContent = 
                 "(function() {\n" +
                 "  try {\n" +
                      scriptText + "\n" +
                 "  } catch(e) {\n" +
                 "    console.error('Runtime error in generated script:', e);\n" +
                 "  }\n" +
                 "})();";
            }

            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(newScript, oldScript);
            } else {
              console.warn(
                'Script tag found without a parent node:',
                oldScript,
              );
            }
          } catch (e) {
            console.error(
              'Error processing/executing script tag.',
              {
                scriptContent:
                  oldScript.innerHTML.substring(0, 100) + '...',
                error: e,
              },
            );
          }
        });
        processedHtmlContentRef.current = htmlContent; // Mark this content as processed
      }
    } else {
      // If loading, reset the processed content ref.
      processedHtmlContentRef.current = null;
    }

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [htmlContent, onInteract, appContext, isLoading]);

  return (
    <div
      ref={contentRef}
      className="w-full h-full overflow-y-auto"
      dangerouslySetInnerHTML={{__html: htmlContent}}
    />
  );
};
