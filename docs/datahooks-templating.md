# Datahooks templating Guide

Datahooks is a feature in Pensieve that allows you to run custom export logic
after a recording has been processed. This allows you to store copies of your
recordings in your personal files, in a markdown-based note-taking system, or
move data to external integrations (for example, you can call a custom shell
script which could further process the data from your recording).

The path for each datahook, which decides where to store the data, is defined
as a Handlebars template. Also, Markdown files that are created from a recording
also have their contents specified through a Handlebars template. You can find
some general documentation on [how to use Handlebars templates here](https://handlebarsjs.com/guide/).

## Variables

The following variables are available for use in your Handlebars templates:

- `{{started}}` - The start time/date of the recording in ISO format
- `{{date}}` - Alias for the start time
- `{{summary.summary}}` - If LLM-based summarization is enabled, the long summary
- `{{summary.actionItems[i]}}` - If LLM-based summarization is enabled, each action item
- `{{summary.sentenceSummary}}` - If LLM-based summarization is enabled, a summary in one sentence
- `{{highlights[i]}}` - Each manually created highlight moment as number timestamp
- `{{language}}` - The inferred language from the recording
- `{{mp3Path}}` - After/if the MP3 was copied out, the target path
- `{{homedir}}` - User home directory
- `{{transcript[i].timestamps.from}}` - The starting timestamp, as text
- `{{transcript[i].timestamps.to}}` - The ending timestamp
- `{{transcript[i].offsets.from}}` - The starting timestamp, in milliseconds
- `{{transcript[i].offsets.to}}` - The ending timestamp, in milliseconds
- `{{transcript[i].text}}` - The text of the transcript
- `{{transcript[i].speaker}}` - The speaker of the transcript, usually either "0" or "1"
- `{{assets[i].file}}` - The target path for each extracted screenshot.

## Helpers

Handlebars allows you to use helpers in variables, meaning that something like
`{{ year "2024-03-01" }}`, or `{{ year date }}` would return `2024`. The following
helpers are available:

- `year` - Returns the year of a given date
- `month` - Returns the month of a given date
- `day` - Returns the day of a given date
- `localeDateTime` - Returns the date and time in the user's locale
- `localeDate` - Returns the date in the user's locale
- `localeTime` - Returns the time in the user's locale
- `keydate` - Returns the date in the format `YYYY-MM-DD`
- `pathsafe` - Returns a path-safe version of the input string, i.e. replacing non-alphanumeric characters with underscores
- `relative` - Returns the relative path from the provided path to the currently processed file.
- `ifEquals` - Returns the content of the helper bracket if the two arguments are equal
- `ifNotEquals` - Returns the content of the helper bracket if the two arguments are not equal