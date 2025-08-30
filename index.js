function main() {
  console.log('Markdown URL Copy plugin loaded');

  logseq.App.registerUIItem('pagebar', {
    key: 'copy-page-markdown-link',
    template: `
     <a data-on-click="copyPageAsMarkdownLink" title="Copy page URL as Markdown link"> 
      <span class="material-symbols-outlined">
        Link
      </span>
     </a> 
    `,
  })
}

function createModel() {
  return {
    async copyPageAsMarkdownLink() {
      try {
        const currentPage = await logseq.Editor.getCurrentPage();

        if (!currentPage) {
          logseq.UI.showMsg('Current page not found', 'error');
          return;
        }

        const pageName = currentPage.originalName || currentPage.name;

        // Build Logseq page URL
        // Format: logseq://graph/[graph-name]?page=[page-name]
        const currentGraph = await logseq.App.getCurrentGraph();
        const graphName = encodeURIComponent(currentGraph.name || 'main');
        const encodedPageName = encodeURIComponent(pageName);
        const pageUrl = `logseq://graph/${graphName}?page=${encodedPageName}`;

        const markdownLink = `[${pageName}](${pageUrl})`;

        window.focus();
        await navigator.clipboard.writeText(markdownLink);

        logseq.UI.showMsg(`Markdown link copied: ${markdownLink}`, 'success');

      } catch (error) {
        console.error('Error occurred:', error);
        logseq.UI.showMsg('Failed to copy', 'error');
      }
    }
  }
}
logseq.ready(createModel(), main).catch(console.error);