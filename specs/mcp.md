# MCP Feature

The app should expose an MCP server if configured by the user, that can be used to query recordings and transcripts, and open recordings in the app. This can be used by external tools to integrate with the app, such as a command line tool or a web interface.

Use the @modelcontextprotocol/sdk package. The settings should expose the option to enable the MCP server, and configure the port it runs on. The server should be started when the app starts, and stopped when the app is closed. The settings also contain copyable code snippets on how to add the MCP server to common external tools, like Claude, Copilot, Raycast, or a command line tool. Disableing the MCP server should stop the server and make the code snippets disappear.

## Embeddings

So that recordings can be found with semantic search, recordings need to be embedded. A new postprocessing step needs to be implemented, called "Embedding". This step uses Langchain to create an embedding. Options in the settings allow the user to configure

- If recordings should be embedded or not
- If embeddings are created using Ollama or OpenAI
- Embedding model
- Ollama/OpenAI configuration, similar to other step configurations

Embeddings are stored in the folder of each recording, in a file called "embedding.json".

In the history view, there should be a menu item in the top right dropdown "Filter", with subitems "All recordings", "Unprocessed recordings", "Recordings without embeddings". Also, there should be an item "Bulk actions", with items "Process all unprocessed", and "Compute missing embeddings", "Run all datahooks".

Methods should be exposed that allow semantic search. They will start a memory vector store that loads all local embedding files. Once the store is loaded, it will be reused for future searches. The query methods have a parameter "useSemanticSearch" that allows to specify if the search should be semantic or not. If semantic search is used, the query is embedded and a similarity search is performed on the vector store. The results are returned sorted by similarity score, and include the recording details and the transcript lines that matched the query. Otherwise, a regular search is performed on the transcript lines, and the results are returned sorted by date.

The search bar in the history view should have a "AI sprinkle" button next to it, if embeddings are enabled. If this button is toggled, then semantic search should be used instead of regular search.

## Tools

- query-recordings({ search?, startDate?, endDate?, recordingId?, offset? }): Query all recordings for semantic search results. If not providing a query, return all recordings. Always limits to 20 results. Result contains details on how many total results, what the current offset is.
- read-transcript({ recordingId, startLine?, length? }): Read the transcript of a recording by its ID
- recording-details({ recordingId }): Get details of a recording by its ID, including title, summary, notes, etc
- open-recording({ recordingId, highlightedLine? }): Open the recording in the app

## Embedded Chat

Add a new tab to the main view, named "Chat". In there, the user can chat with an LLM about their recordings. The chat has the same tools as the MCP server, excluding the open-recording tool.

For the chat to be enabled, in the settings under "Chat", the chat should be enabled and set to either openai or ollama. If disabled, the chat tab is still visible, but shows an empty state with instructions on how to enable the chat.

The chat UI has an input field at the bottom, and the conversation at the top. New messages make the container to scroll down.

### Follow up features

#### Chat History

Previous chats are stored as JSON files in the app data folder. The user can view a list of previous chats in a dropdown icon button at the top right of the chat view.

#### Richer responses

The LLM can respond with rich elements:

`<recording id="123" highlightedLine="5"/>` renders a card with the recording title, date, and snippet of the transcript around the highlighted line. The card has a button that opens the recording in a new window.

`<recording id="123"/>` renders a card with the recording title and date, without a transcript snippet. The card has a button that opens the recording in a new window.

`<recording-lines id="123" startLine="5" length="10"/>` renders a card with the specified lines of the transcript. Clicking any of the lines opens the recording in a new window, with the line highlighted.
