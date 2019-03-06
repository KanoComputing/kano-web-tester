class MarkdownSummaryReport {
    constructor(opts) {
        this.file = opts.file || 'coverage-summary.md';
        this.contentWriter = null;
    }
    onStart(root, context) {
        this.contentWriter = context.writer.writeFile(this.file);
    }
    getLine(total, id, label) {
        return `
    <tr>
        <td>${label}</td>
        <td>${total[id].pct}%</td>
        <td>${total[id].covered}/${total[id].total}</td>
    </tr>
        `.trim();
    }
    onSummary(node) {
        if (!node.isRoot()) {
            return;
        }
        const total = node.getCoverageSummary();
        this.contentWriter.write(`
<table>
    <tr>
        <th colspan="3">Coverage summary</th>
    </tr>
${this.getLine(total, 'statements', 'Statements')}
${this.getLine(total, 'branches', 'Branches')}
${this.getLine(total, 'functions', 'Functions')}
${this.getLine(total, 'lines', 'Lines')}
</table>
        `.trim());
    }
    onEnd() {
        this.contentWriter.close();
    }
}

module.exports = MarkdownSummaryReport;
