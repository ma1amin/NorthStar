const HEAD_PATTERN = /<head\b[^>]*>([\s\S]*?)<\/head>/i;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const STYLESHEET_LINK_PATTERN = /<link\b(?=[^>]*\brel=(?:"stylesheet"|'stylesheet'|stylesheet))[^>]*>/gi;
const MODULE_SCRIPT_PATTERN = /<script\b(?=[^>]*\btype=(?:"module"|'module'|module))[^>]*>[\s\S]*?<\/script>/i;

/**
 * Vite emits module scripts before extracted stylesheets by default. For a
 * static, hydration-based preview we deliberately surface the stylesheet first
 * so a browser can resolve render-blocking CSS before any module evaluation.
 */
export function prioritizeStylesheetLinks(html: string) {
  return html.replace(HEAD_PATTERN, (fullHead, headContents: string) => {
    const comments: string[] = [];
    const headWithoutComments = headContents.replace(HTML_COMMENT_PATTERN, (comment) => {
      const token = `__NORTHSTAR_HTML_COMMENT_${comments.length}__`;
      comments.push(comment);
      return token;
    });
    const stylesheetLinks = headWithoutComments.match(STYLESHEET_LINK_PATTERN);
    if (!stylesheetLinks?.length) return fullHead;

    const headWithoutStylesheets = headWithoutComments.replace(STYLESHEET_LINK_PATTERN, "");
    const moduleScript = headWithoutStylesheets.match(MODULE_SCRIPT_PATTERN)?.[0];
    if (!moduleScript) return fullHead;

    const stylesheetBlock = `${stylesheetLinks.join("\n    ")}\n    `;
    const prioritizedHead = headWithoutStylesheets
      .replace(moduleScript, `${stylesheetBlock}${moduleScript}`)
      .replace(/__NORTHSTAR_HTML_COMMENT_(\d+)__/g, (_, index) => comments[Number(index)] ?? "");
    return fullHead.replace(headContents, prioritizedHead);
  });
}
