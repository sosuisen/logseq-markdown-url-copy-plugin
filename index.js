const copyTextToClipboard = async (text) => {
  try {
    window.focus();
    await navigator.clipboard.writeText(text);
    logseq.UI.showMsg(`Markdown link copied: ${text}`, 'success');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    logseq.UI.showMsg('Failed to copy text to clipboard', 'error');
  }
}

const createBaseGraphURL = async () => {
  const currentGraph = await logseq.App.getCurrentGraph();
  if (!currentGraph) {
    return null;
  }
  const graphName = encodeURIComponent(currentGraph.name);
  return `logseq://graph/${graphName}`;
}

const createPageURL = async (pageName) => {
  const encodedPageName = encodeURIComponent(pageName);
  return `${await createBaseGraphURL()}?page=${encodedPageName}`;
}

const createBlockURL = async ({ uuid }) => {
  return `${await createBaseGraphURL()}?block-id=${uuid}`;
}

const copyBlockAsMarkdownLink = async ({ uuid }) => {
  const currentBlock = await logseq.Editor.getBlock(uuid);
  if (!currentBlock) {
    logseq.UI.showMsg('Current block not found', 'error');
    return;
  }
  let blockContent = currentBlock.content || 'block';
  blockContent = getBlockSummary(blockContent);

  const blockURL = await createBlockURL({ uuid });
  const markdownLink = `[${blockContent}](${blockURL})`;
  await copyTextToClipboard(markdownLink);

  await logseq.Editor.upsertBlockProperty(uuid, 'id', uuid);
}

const getBlockSummary = (blockContent) => {
  const imageMatch = blockContent.match(/^!\[([^\]]*)\]\([^\)]*\)/);
  const linkMatch = blockContent.match(/^\[([^\]]*)\]\([^\)]*\)/);
  if (blockContent.startsWith('#+BEGIN')) {
    const lines = blockContent.split('\n');
    blockContent = lines[1] || 'Org-mode block';
  } else if (imageMatch) {
    blockContent = imageMatch[1];
  } else if (linkMatch) {
    blockContent = linkMatch[1];
  } else if (blockContent.startsWith('```')) {
    blockContent = 'code block';
  } else {
    blockContent = blockContent.replace(/^(#+\s*|>\s*)/, '');
  }
  blockContent = blockContent.split('\n')[0];
  blockContent = blockContent.replace(/[\[\]]/g, '');
  return blockContent;
}

const copyPageAsMarkdownLink = async () => {
  const currentPage = await logseq.Editor.getCurrentPage();
  if (!currentPage) {
    logseq.UI.showMsg('Current page not found', 'error');
    return;
  }
  const pageName = currentPage.originalName || currentPage.name;
  // Build Logseq page URL
  // Format: logseq://graph/[graph-name]?page=[page-name]
  const pageUrl = await createPageURL(pageName);
  if (!pageUrl) {
    logseq.UI.showMsg('Current graph not found', 'error');
    return;
  }
  const markdownLink = `[${pageName}](${pageUrl})`;
  await copyTextToClipboard(markdownLink);
}

const createModel = () => {
  return {
    copyPageAsMarkdownLink,
    copyBlockAsMarkdownLink,
  }
}

const main = () => {
  console.log('Markdown URL Copy plugin loaded');

  logseq.App.registerPageMenuItem('Copy page URL as Markdown link', (e) => {
    copyPageAsMarkdownLink();
  });

  logseq.App.registerUIItem('pagebar', {
    key: 'copy-page-markdown-link',
    template: `
     <a data-on-click="copyPageAsMarkdownLink" title="Copy page URL as Markdown link"> 
      <span class="material-symbols-outlined">
        link
      </span>
     </a> 
    `,
  });

  logseq.Editor.registerSlashCommand('Copy block URL as Markdown link', async ({ uuid }) => {
    await copyBlockAsMarkdownLink({ uuid });
  })

  logseq.Editor.registerBlockContextMenuItem('Copy block URL as Markdown link', async ({ uuid }) => {
    await copyBlockAsMarkdownLink({ uuid });
  });

  logseq.provideStyle(`
    @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0");
  `)
}

logseq.ready(createModel(), main).catch(console.error);