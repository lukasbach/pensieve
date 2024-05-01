export const datahookMarkdownTemplate = `# {{name}}

> Recording from {{ localeDateTime date }}, {{ durationString }}

{{#if mp3Path}}
[MP3 Recording]({{ relative mp3Path }})

{{/if}}
{{#if summary}}
## Summary

{{ summary.summary }}

{{/if}}
{{#if transcript}}
## Transcript

{{#each transcript}}
- {{#ifEquals speaker "0"}}They:{{/ifEquals}}{{#ifEquals speaker "1"}}Me:  {{/ifEquals}}{{{ text }}}
{{/each}}

{{/if}}
{{#if notes}}
## Notes

{{ notes }}

{{/if}}
{{#if summary.actionItems}}
### Action Items

{{#each summary.actionItems}}
- {{ action }} ({{ time }}s)
{{/each}}

{{/if}}
{{#if assets}}
## Screenshots

{{#each assets}}
![Screenshot]({{ relative file }})
{{/each}}

{{/if}}
`;
